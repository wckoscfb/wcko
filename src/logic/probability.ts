import { MATCHES, ROUND_OF, ROUND_ORDER } from '../data/bracket';
import { bradleyTerryTopWins, thirdsCandidateDistribution } from '../data/odds';
import { collectSubtreeByRound } from './paths';
import type { Match, MatchId, Round, SlotSpec, TeamCode, WinnerDist } from '../types';

/**
 * Determine which round level to use as the "leaf" for probability computation
 * over a subtree rooted at `rootMatchId`. Strategy: pick the deepest-toward-root
 * level where every match has both slots populated. Returns null if no level
 * is fully complete (caller falls back to partial propagation).
 */
export function determineLeafLevel(
  rootMatchId: MatchId,
  placements: Record<string, TeamCode>,
): Round | null {
  const byRound = collectSubtreeByRound(rootMatchId);
  const presentRounds = ROUND_ORDER.filter(r => byRound[r].length > 0);
  for (let i = presentRounds.length - 1; i >= 0; i--) {
    const round = presentRounds[i];
    const matches = byRound[round];
    const allFilled = matches.every(
      mid => placements[`${mid}.A`] && placements[`${mid}.B`],
    );
    if (allFilled) return round;
  }
  return null;
}

/**
 * Compute the winner distribution over the subtree rooted at `rootMatchId`.
 *
 * Behaviour summary:
 *  - leafLevel = R16 (R16 fully filled): R16 placements are the leaves; combine
 *    each match's two placed teams using its odds (or Bradley-Terry if none).
 *  - leafLevel = R32 (R32 fully filled, R16 empty/partial): propagate from R32
 *    leaves. For each R16 match, enumerate (top × bot) winner combinations and
 *    apply per-matchup odds (explicit or Bradley-Terry).
 *  - Partial R16 placements with R32 fully filled: the placed R16 slot uses
 *    its placement; the empty slot propagates from R32. Per-matchup BT odds
 *    apply across all combinations.
 *  - leafLevel = null (nothing fully complete): partial propagation — recurse
 *    all the way down, using whatever's filled.
 *
 * Per-match odds resolution priority:
 *  1. Explicit user-typed odds (top side wins X%, applied uniformly across combos).
 *  2. Bradley-Terry from each matchup's WC win probabilities (the default; gives
 *     realistic per-pair odds without requiring user input).
 *  3. 1° vs 3° auto-resolve to 1° (only if BT can't compute — e.g. team missing
 *     from WC_WIN_PROB table).
 *  4. 50/50 fallback (only if all above fail).
 */
export function computeWinnerDistribution(
  rootMatchId: MatchId,
  placements: Record<string, TeamCode>,
  odds: Record<MatchId, string>,
): WinnerDist {
  const leafLevel = determineLeafLevel(rootMatchId, placements);
  return computeAtLevel(rootMatchId, placements, odds, leafLevel);
}

function computeAtLevel(
  rootMatchId: MatchId,
  placements: Record<string, TeamCode>,
  odds: Record<MatchId, string>,
  leafLevel: Round | null,
): WinnerDist {
  const m = MATCHES[rootMatchId];
  const matchRound = ROUND_OF[rootMatchId];

  let topDist: WinnerDist;
  let botDist: WinnerDist;

  if (matchRound === leafLevel) {
    // This match is the agreed leaf — both slots have placements (guaranteed
    // by determineLeafLevel). Use them directly.
    const topPlaced = placements[`${rootMatchId}.A`];
    const botPlaced = placements[`${rootMatchId}.B`];
    topDist = topPlaced ? new Map([[topPlaced, 1]]) : new Map();
    botDist = botPlaced ? new Map([[botPlaced, 1]]) : new Map();
  } else {
    // distFor: explicit placement at this slot wins; otherwise recurse for
    // winnerOf. Lets partial higher-round placements be respected — e.g. user
    // placed Brazil at G93.A but left G93.B empty: top = {Brazil:1},
    // bot = propagation of G84.
    //
    // For empty `thirds` slots specifically: rather than treating the slot as
    // "no one is here" (which would make 1° vs empty-3° auto-resolve to 100%
    // for the 1° team), we estimate the unknown 3° finisher as a uniform
    // distribution over all teams in the eligible groups. Bradley-Terry then
    // computes per-matchup odds against the placed 1° team. Realistic: a 1°
    // team facing an unknown 3° usually wins 70-90% (not 100%), and the small
    // upset chance gets distributed across the eligible 3° candidates.
    function distFor(slot: SlotSpec, slotKey: string): WinnerDist {
      const placed = placements[slotKey];
      if (placed) return new Map([[placed, 1]]);
      if (slot.kind === 'winnerOf') {
        const upstream = computeAtLevel(slot.matchId, placements, odds, leafLevel);
        if (upstream.size > 0) return upstream;
        return new Map();
      }
      if (slot.kind === 'thirds') {
        // Realistic estimate: rank-based per-group 3°-finish probability
        // (strong teams almost never finish 3°, the 3rd-strongest most often does).
        return thirdsCandidateDistribution(slot.groups);
      }
      return new Map();
    }
    topDist = distFor(m.A, `${rootMatchId}.A`);
    botDist = distFor(m.B, `${rootMatchId}.B`);
  }

  return combineSlotDistributions(topDist, botDist, m, rootMatchId, odds);
}

function combineSlotDistributions(
  topDist: WinnerDist,
  botDist: WinnerDist,
  m: Match,
  matchId: MatchId,
  odds: Record<MatchId, string>,
): WinnerDist {
  const topHas = topDist.size > 0;
  const botHas = botDist.size > 0;

  if (!topHas && !botHas) return new Map();
  if (topHas && !botHas) return new Map(topDist);
  if (!topHas && botHas) return new Map(botDist);

  const isOneVsThird =
    (m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds') ||
    (m.B.kind === 'group' && m.B.pos === 1 && m.A.kind === 'thirds');
  const oneIsTop = m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds';

  const oddsRaw = odds[matchId];
  const explicitTopWinPct =
    oddsRaw === undefined || oddsRaw === null || oddsRaw === ''
      ? null
      : Number(oddsRaw);

  const result: WinnerDist = new Map();
  for (const [topTeam, topProb] of topDist) {
    for (const [botTeam, botProb] of botDist) {
      const comboProb = topProb * botProb;
      if (comboProb < 1e-12) continue;

      let topWinFrac: number;
      if (explicitTopWinPct !== null && !Number.isNaN(explicitTopWinPct)) {
        // Explicit user odds: uniform across combinations
        topWinFrac = explicitTopWinPct / 100;
      } else {
        // Bradley-Terry per matchup (the default)
        const bt = bradleyTerryTopWins(topTeam, botTeam);
        if (bt !== null) {
          topWinFrac = bt / 100;
        } else if (isOneVsThird) {
          // BT couldn't compute (team missing from WC_WIN_PROB) — fall back to spec rule
          topWinFrac = oneIsTop ? 1 : 0;
        } else {
          topWinFrac = 0.5;
        }
      }
      const botWinFrac = 1 - topWinFrac;

      if (topWinFrac > 0) {
        result.set(topTeam, (result.get(topTeam) || 0) + comboProb * topWinFrac);
      }
      if (botWinFrac > 0) {
        result.set(botTeam, (result.get(botTeam) || 0) + comboProb * botWinFrac);
      }
    }
  }

  for (const [k, v] of [...result]) if (v < 1e-9) result.delete(k);
  return result;
}

export function isDeterministic(dist: WinnerDist): boolean {
  if (dist.size === 0) return true;
  if (dist.size === 1) {
    const v = [...dist.values()][0];
    return Math.abs(v - 1) < 1e-9;
  }
  return false;
}

export function sortedDist(dist: WinnerDist): Array<[TeamCode, number]> {
  return [...dist.entries()].sort((a, b) => b[1] - a[1]);
}

/** 1° vs 3° detection used by MatchBox UI for the "auto→1°" badge. */
export function matchIsOneVsThird(matchId: MatchId): boolean {
  const m = MATCHES[matchId];
  return (
    (m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds') ||
    (m.B.kind === 'group' && m.B.pos === 1 && m.A.kind === 'thirds')
  );
}
