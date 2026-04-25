import type { GroupLetter, TeamCode } from '../types';
import { GROUPS } from './teams';

/**
 * Editorial pre-tournament estimates of each team's probability of winning the
 * 2026 FIFA World Cup. Numbers are a synthesis of bookmaker consensus and FIFA
 * ranking position as of early 2026 — they are NOT official, NOT live, and
 * NOT sourced from a licensed odds provider.
 *
 * Update freely as the tournament approaches. Sum should be close to 100 (1.0)
 * but doesn't need to be exact for the head-to-head computation to work, since
 * Bradley-Terry only cares about relative magnitudes.
 *
 * To refresh: search "world cup 2026 winner odds" on a major aggregator
 * (Oddschecker, Pinnacle, Bet365, FiveThirtyEight) and adjust accordingly.
 */
export const WC_WIN_PROB: Record<TeamCode, number> = {
  // Tier 1 — top favorites (~55% combined)
  ARG: 0.13,  // defending champions
  FRA: 0.12,
  BRA: 0.11,
  ENG: 0.10,
  ESP: 0.09,

  // Tier 2 — strong contenders (~24% combined)
  GER: 0.06,
  POR: 0.06,
  NED: 0.045,
  BEL: 0.03,
  CRO: 0.025,
  URU: 0.022,

  // Tier 3 — outside shots (~13% combined)
  USA: 0.018,   // co-host advantage
  MEX: 0.015,   // co-host
  COL: 0.014,
  MAR: 0.013,
  SUI: 0.011,
  SEN: 0.011,
  CIV: 0.010,
  JPN: 0.010,
  CAN: 0.008,   // co-host
  KOR: 0.008,
  CZE: 0.007,
  AUS: 0.007,
  TUR: 0.007,
  EGY: 0.007,
  IRN: 0.006,
  AUT: 0.006,
  PAR: 0.005,
  ECU: 0.005,
  NOR: 0.005,

  // Tier 4 — long shots (combined ~8%)
  SWE: 0.004,
  GHA: 0.004,
  ALG: 0.004,
  TUN: 0.004,
  SCO: 0.004,
  IRQ: 0.003,
  BIH: 0.003,
  COD: 0.003,
  UZB: 0.003,
  PAN: 0.003,
  RSA: 0.003,
  CPV: 0.003,
  HTI: 0.002,
  NZL: 0.002,
  JOR: 0.002,
  CUW: 0.002,
  KSA: 0.002,
  QAT: 0.002,
};

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
 * each team finishes 3°.
 *
 * Per-match probabilities come from Bradley-Terry on WC_WIN_PROB. Tiebreakers
 * for equal wins use WCP (proxy for goal difference). Result is cached per
 * group letter — only ever computed 12 times across the app's lifetime.
 *
 * This is much more accurate than a rank-based heuristic because it correctly
 * models situations like "very strong team in a weak group" (the strong team
 * almost never finishes 3°) vs "evenly matched group" (3° distribution closer
 * to uniform).
 */
const _thirdPlaceCache = new Map<GroupLetter, Map<TeamCode, number>>();

export function thirdPlaceProbabilities(groupLetter: GroupLetter): Map<TeamCode, number> {
  const cached = _thirdPlaceCache.get(groupLetter);
  if (cached) return cached;

  const teams = GROUPS[groupLetter];
  // 6 matches in a 4-team round-robin: pairs (i, j) with i < j
  const matches: Array<[number, number]> = [];
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) matches.push([i, j]);
  }

  // Per-match BT probability that team i beats team j
  const matchProbs = matches.map(([i, j]) => {
    const bt = bradleyTerryTopWins(teams[i], teams[j]);
    return bt !== null ? bt / 100 : 0.5;
  });

  const result = new Map<TeamCode, number>(teams.map(t => [t, 0]));

  // Enumerate all 2^6 = 64 outcomes
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
    // Determine 3rd-place finisher: sort indices by wins desc, WCP desc as tiebreak
    const indices = [0, 1, 2, 3];
    indices.sort((a, b) => {
      if (wins[b] !== wins[a]) return wins[b] - wins[a];
      return (WC_WIN_PROB[teams[b]] ?? 0) - (WC_WIN_PROB[teams[a]] ?? 0);
    });
    const thirdPlaceTeam = teams[indices[2]];
    result.set(thirdPlaceTeam, (result.get(thirdPlaceTeam) ?? 0) + outcomeProb);
  }

  _thirdPlaceCache.set(groupLetter, result);
  return result;
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
