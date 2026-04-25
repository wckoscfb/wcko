import { MATCHES } from '../data/bracket';
import { bradleyTerryTopWins } from '../data/odds';
import type { MatchId, SlotSpec, TeamCode, WinnerDist } from '../types';

/**
 * Effective odds for a single match. Returns the % chance the TOP slot wins,
 * in [0, 100], OR null if the match is unresolved (no explicit odds and the
 * estimator either isn't enabled or can't produce a value).
 *
 * Priority:
 *  1. Explicit user-typed odds (always wins).
 *  2. Auto-estimate via Bradley-Terry, if enabled AND both sides have a single
 *     unambiguous team placed AND both teams are in the WC_WIN_PROB table.
 *  3. null → caller falls back to 1°-vs-3° rule or 50/50.
 */
export function effectiveTopWinPct(
  matchId: MatchId,
  topDist: WinnerDist,
  botDist: WinnerDist,
  odds: Record<MatchId, string>,
  useEstimatedOdds: boolean,
): number | null {
  const oddsRaw = odds[matchId];
  if (oddsRaw !== undefined && oddsRaw !== null && oddsRaw !== '') {
    const n = Number(oddsRaw);
    if (!Number.isNaN(n)) return n;
  }
  if (!useEstimatedOdds) return null;
  // Estimate only when both sides resolve to a single team
  if (topDist.size !== 1 || botDist.size !== 1) return null;
  const topTeam = [...topDist.keys()][0];
  const botTeam = [...botDist.keys()][0];
  return bradleyTerryTopWins(topTeam, botTeam);
}

/**
 * Compute the probability distribution over teams that emerge as the winner of `rootMatchId`.
 *
 * Rules (in priority order):
 *  - If a slot has an EXPLICIT placement, it's treated as a leaf with prob 1 — overrides
 *    the upstream computation. Lets users fill higher-round slots directly.
 *  - Otherwise winnerOf slots recurse into their feeder subtree.
 *  - Group/thirds slots without a placement contribute the empty distribution.
 *  - Match win odds:
 *      1. Explicit user odds → use them.
 *      2. Auto-estimate (if toggle on, both sides single-team, both in odds table) → BT.
 *      3. 1° vs 3° → auto-resolves to 1°.
 *      4. Default → 50/50 so upstream odds propagate.
 *  - Single slot populated: that side wins with prob 1.
 */
export function computeWinnerDistribution(
  rootMatchId: MatchId,
  placements: Record<string, TeamCode>,
  odds: Record<MatchId, string>,
  useEstimatedOdds: boolean = false,
): WinnerDist {
  function distFor(slot: SlotSpec, slotKey: string): WinnerDist {
    const placed = placements[slotKey];
    if (placed) return new Map([[placed, 1]]);
    if (slot.kind === 'winnerOf') {
      return computeWinnerDistribution(slot.matchId, placements, odds, useEstimatedOdds);
    }
    return new Map();
  }

  const m = MATCHES[rootMatchId];
  const topDist = distFor(m.A, `${rootMatchId}.A`);
  const botDist = distFor(m.B, `${rootMatchId}.B`);
  const topHas = topDist.size > 0;
  const botHas = botDist.size > 0;

  if (!topHas && !botHas) return new Map();

  const isOneVsThird =
    (m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds') ||
    (m.B.kind === 'group' && m.B.pos === 1 && m.A.kind === 'thirds');
  const oneIsTop = m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds';

  let topWin = 0;
  let botWin = 0;

  const effective = effectiveTopWinPct(rootMatchId, topDist, botDist, odds, useEstimatedOdds);

  if (topHas && !botHas) {
    topWin = 1;
  } else if (!topHas && botHas) {
    botWin = 1;
  } else if (effective !== null) {
    if (effective === 0 || effective === 100) {
      topWin = effective === 100 ? 1 : 0;
      botWin = 1 - topWin;
    } else {
      topWin = effective / 100;
      botWin = (100 - effective) / 100;
    }
  } else {
    // No explicit odds, no estimate available
    if (isOneVsThird) {
      if (oneIsTop) topWin = 1; else botWin = 1;
    } else {
      topWin = 0.5; botWin = 0.5;
    }
  }

  const result: WinnerDist = new Map();
  if (topWin > 0) {
    for (const [t, p] of topDist) result.set(t, (result.get(t) || 0) + p * topWin);
  }
  if (botWin > 0) {
    for (const [t, p] of botDist) result.set(t, (result.get(t) || 0) + p * botWin);
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

/** Helper: 1° vs 3° detection used by MatchBox UI for the "auto→1°" badge. */
export function matchIsOneVsThird(matchId: MatchId): boolean {
  const m = MATCHES[matchId];
  return (
    (m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds') ||
    (m.B.kind === 'group' && m.B.pos === 1 && m.A.kind === 'thirds')
  );
}

