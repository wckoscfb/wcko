import type { GroupLetter, TeamCode } from '../types';
import { GROUPS } from './teams';
import wcWinProbData from './wc-win-prob.json';

/**
 * Each team's probability of winning the 2026 FIFA World Cup.
 *
 * Values come from `wc-win-prob.json`, which is auto-refreshed every 6 hours
 * by the GitHub Action `.github/workflows/refresh-odds.yml` from The Odds API
 * (de-vigged consensus across multiple bookmakers, then median-aggregated).
 *
 * If the GitHub Action isn't set up yet, the JSON file holds the editorial
 * starter values shipped with the project. Edit the JSON directly for a
 * manual update; the simulation will pick up the new values on next build.
 */
export const WC_WIN_PROB: Record<TeamCode, number> = wcWinProbData;

/**
 * Bradley-Terry head-to-head estimate.
 * P(team A beats team B) = p_A / (p_A + p_B)
 *
 * Returned value is in [0, 100] (matches the format of the odds input).
 * Returns null if either team has no recorded WC win probability.
 */
export function bradleyTerryTopWins(topTeam: TeamCode, botTeam: TeamCode): number | null {
  const a = WC_WIN_PROB[topTeam];
  const b = WC_WIN_PROB[botTeam];
  if (a == null || b == null || a + b <= 0) return null;
  const p = a / (a + b);
  // Clamp to [0.01, 0.99] so we never produce an exact deterministic odds
  // (which would short-circuit the probability propagation in suspicious ways)
  const clamped = Math.max(0.01, Math.min(0.99, p));
  return Math.round(clamped * 100);
}

/**
 * Analytical group-stage simulation: for a 4-team group, enumerate all 2^6 = 64
 * possible match outcomes (no draws — the BT model is binary). For each
 * outcome, compute per-team wins and rank, then accumulate the probability
 * each team finishes 1st / 2nd / 3rd / 4th.
 *
 * Per-match probabilities come from Bradley-Terry on WC_WIN_PROB. Tiebreakers
 * for equal wins use WCP (proxy for goal difference). Cached per group letter —
 * only ever computed 12 times across the app's lifetime.
 *
 * Returns: Map<TeamCode, [P(1°), P(2°), P(3°), P(4°)]>. Each per-team array
 * sums to 1 (the team always finishes somewhere); each per-position column
 * sums to 1 (exactly one team holds each position).
 */
const _groupSimCache = new Map<GroupLetter, Map<TeamCode, [number, number, number, number]>>();

export function simulateGroup(groupLetter: GroupLetter): Map<TeamCode, [number, number, number, number]> {
  const cached = _groupSimCache.get(groupLetter);
  if (cached) return cached;

  const teams = GROUPS[groupLetter];
  const matches: Array<[number, number]> = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) matches.push([i, j]);
  }
  const matchProbs = matches.map(([i, j]) => {
    const bt = bradleyTerryTopWins(teams[i], teams[j]);
    return bt !== null ? bt / 100 : 0.5;
  });

  const positions = new Map<TeamCode, [number, number, number, number]>(
    teams.map(t => [t, [0, 0, 0, 0]]),
  );

  const numOutcomes = 1 << matches.length;
  for (let outcome = 0; outcome < numOutcomes; outcome++) {
    let outcomeProb = 1;
    const wins = [0, 0, 0, 0];
    for (let m = 0; m < matches.length; m++) {
      const [i, j] = matches[m];
      const iWon = (outcome >> m) & 1;
      if (iWon) {
        wins[i]++;
        outcomeProb *= matchProbs[m];
      } else {
        wins[j]++;
        outcomeProb *= 1 - matchProbs[m];
      }
    }
    const indices = [0, 1, 2, 3];
    indices.sort((a, b) => {
      if (wins[b] !== wins[a]) return wins[b] - wins[a];
      return (WC_WIN_PROB[teams[b]] ?? 0) - (WC_WIN_PROB[teams[a]] ?? 0);
    });
    for (let pos = 0; pos < 4; pos++) {
      positions.get(teams[indices[pos]])![pos] += outcomeProb;
    }
  }

  _groupSimCache.set(groupLetter, positions);
  return positions;
}

/**
 * Probability distribution over teams in `groupLetter` finishing at the given
 * position (1, 2, 3, or 4). Used for empty group slots in the bracket.
 */
export function positionProbabilities(
  groupLetter: GroupLetter,
  pos: 1 | 2 | 3 | 4,
): Map<TeamCode, number> {
  const sim = simulateGroup(groupLetter);
  const result = new Map<TeamCode, number>();
  for (const [team, probs] of sim) {
    result.set(team, probs[pos - 1]);
  }
  return result;
}

/** Internal alias used by `thirdsCandidateDistribution` below. */
function thirdPlaceProbabilities(groupLetter: GroupLetter): Map<TeamCode, number> {
  return positionProbabilities(groupLetter, 3);
}

/**
 * Estimated candidate distribution for an EMPTY R32 thirds slot specified as
 * "3° from {groups}". Each team's probability of being the actual 3° finisher
 * who lands in this slot:
 *
 *   P(team T) = (1 / numEligibleGroups) × P(T finishes 3° in T's group)
 *
 * The (1/N) weight assumes all eligible groups are equally likely to be the
 * source for this slot — a simplification of FIFA's actual allocation rule
 * (which depends on the global ranking of all 12 group-3° finishers), but
 * close enough for the math to give realistic per-team probabilities.
 *
 * The within-group probability comes from `thirdPlaceProbabilities`, which is
 * a real BT-driven group-stage simulation, NOT a rank heuristic.
 */
export function thirdsCandidateDistribution(groups: GroupLetter[]): Map<TeamCode, number> {
  const dist = new Map<TeamCode, number>();
  const N = groups.length;
  if (N === 0) return dist;
  const slotShare = 1 / N;
  for (const g of groups) {
    const groupDist = thirdPlaceProbabilities(g);
    for (const [team, p] of groupDist) {
      dist.set(team, (dist.get(team) ?? 0) + slotShare * p);
    }
  }
  return dist;
}
