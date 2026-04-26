import { describe, expect, test } from '../../tests/runner';
import { MATCHES, R32, ROUND_OF, TREE } from '../data/bracket';
import { GROUPS } from '../data/teams';
import { eligibleForMatchSide } from './eligibility';
import { collectSubtreeByRound } from './paths';
import {
  computeRoundNOpponentDist,
  computeSurvivalChain,
  computeWinnerDistribution,
  determineLeafLevel,
  isDeterministic,
  matchIsOneVsThird,
  sortedDist,
} from './probability';
import type { MatchId, Round, TeamCode } from '../types';

// Helper: build a placements record from {matchId.side: team} pairs.
function place(...pairs: Array<[string, string]>): Record<string, TeamCode> {
  const out: Record<string, TeamCode> = {};
  for (const [k, v] of pairs) out[k] = v as TeamCode;
  return out;
}

// Helper: sum every probability in a distribution.
function sum(dist: Map<TeamCode, number>): number {
  let s = 0;
  for (const v of dist.values()) s += v;
  return s;
}

describe('determineLeafLevel', () => {
  test('returns null when nothing is placed', () => {
    expect(determineLeafLevel('G89', {})).toBeNull();
  });

  test('returns R32 when all R32 leaves of a subtree are filled', () => {
    // G89 = R16 with R32 children G74 and G77.
    const placements = place(
      ['G74.A', 'GER'], ['G74.B', 'MEX'],
      ['G77.A', 'FRA'], ['G77.B', 'BRA'],
    );
    expect(determineLeafLevel('G89', placements)).toBe('R32');
  });

  test('returns null when any R32 slot in the subtree is missing', () => {
    const placements = place(
      ['G74.A', 'GER'], ['G74.B', 'MEX'],
      ['G77.A', 'FRA'],
      // G77.B missing
    );
    expect(determineLeafLevel('G89', placements)).toBeNull();
  });

  test('prefers the deepest fully-filled level (R16 over R32)', () => {
    // G89 (R16) is fully filled → should pick R16, ignore the R32 children
    const placements = place(
      ['G89.A', 'GER'], ['G89.B', 'BRA'],
      ['G74.A', 'GER'], ['G74.B', 'MEX'],
      ['G77.A', 'FRA'], ['G77.B', 'BRA'],
    );
    expect(determineLeafLevel('G89', placements)).toBe('R16');
  });
});

describe('computeWinnerDistribution', () => {
  test('empty placements + no estimation → empty distribution', () => {
    const dist = computeWinnerDistribution('G89', {}, {}, false);
    expect(dist.size).toBe(0);
  });

  test('empty placements + estimation ON → produces a non-empty distribution that sums to ~1', () => {
    const dist = computeWinnerDistribution('G89', {}, {}, true);
    expect(dist.size).toBeGreaterThan(0);
    expect(sum(dist)).toBeCloseTo(1, 3);
  });

  test('R32 fully placed → distribution sums to 1 and contains only placed teams', () => {
    const placements = place(
      ['G74.A', 'GER'], ['G74.B', 'MEX'],
      ['G77.A', 'FRA'], ['G77.B', 'BRA'],
    );
    const dist = computeWinnerDistribution('G89', placements, {}, true);
    expect(sum(dist)).toBeCloseTo(1, 5);
    const allowed = new Set(['GER', 'MEX', 'FRA', 'BRA']);
    for (const team of dist.keys()) expect(allowed.has(team)).toBeTruthy();
  });

  test('R16 fully placed → distribution is exactly the two R16 teams summing to 1', () => {
    const placements = place(['G89.A', 'GER'], ['G89.B', 'BRA']);
    const dist = computeWinnerDistribution('G89', placements, {}, true);
    expect(dist.size).toBe(2);
    expect(sum(dist)).toBeCloseTo(1, 5);
    expect(dist.has('GER' as TeamCode)).toBeTruthy();
    expect(dist.has('BRA' as TeamCode)).toBeTruthy();
  });

  test('explicit 100% top odds force the top team to win the match', () => {
    const placements = place(['G89.A', 'GER'], ['G89.B', 'BRA']);
    // Note: when leafLevel === R16, computeWinnerDistribution still runs combine
    // on the leaf match. Explicit odds should make GER (top) win 100%.
    const dist = computeWinnerDistribution('G89', placements, { G89: '100' }, true);
    expect(dist.get('GER' as TeamCode)).toBeCloseTo(1, 5);
    expect(dist.get('BRA' as TeamCode) ?? 0).toBeCloseTo(0, 5);
  });

  test('explicit 0% top odds force the bot team to win the match', () => {
    const placements = place(['G89.A', 'GER'], ['G89.B', 'BRA']);
    const dist = computeWinnerDistribution('G89', placements, { G89: '0' }, true);
    expect(dist.get('BRA' as TeamCode)).toBeCloseTo(1, 5);
    expect(dist.get('GER' as TeamCode) ?? 0).toBeCloseTo(0, 5);
  });

  test('manual mode (estimation OFF) with empty slot → distribution mass < 1', () => {
    // Only one R32 leaf placed. The other slot is empty, and without estimation
    // it contributes nothing. Combine with empty → propagates only the placed side.
    const placements = place(['G74.A', 'GER']); // missing G74.B and all of G77
    const dist = computeWinnerDistribution('G89', placements, {}, false);
    // GER should be in the distribution, but no estimation for the rest.
    // The total mass may be less than 1 since the unfilled side doesn't
    // contribute its probability.
    expect(dist.size).toBeGreaterThan(0);
    expect(sum(dist)).toBeLessThanOrEqual(1.0001);
  });

  test('only contains teams eligible for the root subtree', () => {
    // G91 is R16 with G76 and G78 as R32 children. Eligibility is union of those leaf slots.
    const dist = computeWinnerDistribution('G91', {}, {}, true);
    const eligible = new Set<TeamCode>();
    const subtree = collectSubtreeByRound('G91');
    for (const leaf of subtree.R32) {
      for (const side of ['A', 'B'] as const) {
        for (const t of eligibleForMatchSide(leaf, side)) eligible.add(t);
      }
    }
    for (const team of dist.keys()) {
      expect(eligible.has(team)).toBeTruthy();
    }
  });

  test('output matches itself across calls (pure function)', () => {
    const placements = place(
      ['G74.A', 'GER'], ['G74.B', 'MEX'],
      ['G77.A', 'FRA'], ['G77.B', 'BRA'],
    );
    const a = computeWinnerDistribution('G89', placements, {}, true);
    const b = computeWinnerDistribution('G89', placements, {}, true);
    expect(a.size).toBe(b.size);
    for (const [k, v] of a) expect(b.get(k)).toBeCloseTo(v, 9);
  });
});

describe('computeRoundNOpponentDist', () => {
  test('R32 with empty opp slot + estimation OFF → empty', () => {
    const dist = computeRoundNOpponentDist('R32', 'G74', 'A', null, {}, {}, false);
    expect(dist.size).toBe(0);
  });

  test('R32 with empty group opp slot + estimation ON → uses positionProbabilities', () => {
    // G74.A = 1°E, G74.B = thirds {A,B,C,D,F}. Analyzed on side A → opponent is the thirds slot.
    const dist = computeRoundNOpponentDist('R32', 'G74', 'A', null, {}, {}, true);
    expect(dist.size).toBeGreaterThan(0);
    expect(sum(dist)).toBeCloseTo(1, 3);
    // Only contains teams eligible for the thirds slot
    const eligible = eligibleForMatchSide('G74', 'B');
    for (const team of dist.keys()) expect(eligible.has(team)).toBeTruthy();
  });

  test('R32 with placed opp → deterministic single-team distribution', () => {
    const dist = computeRoundNOpponentDist(
      'R32', 'G74', 'A', null,
      place(['G74.B', 'MEX']), {}, true,
    );
    expect(dist.size).toBe(1);
    expect(dist.get('MEX' as TeamCode)).toBe(1);
  });

  test('R16+ delegates to computeWinnerDistribution on the feeder root', () => {
    // R16 match G89 (analyzed on side A means G74 is the analyzed feeder, G77 is opponent feeder).
    const dist = computeRoundNOpponentDist(
      'R16', 'G89', 'A', 'G77', {}, {}, true,
    );
    expect(dist.size).toBeGreaterThan(0);
    expect(sum(dist)).toBeCloseTo(1, 3);
  });
});

describe('computeSurvivalChain', () => {
  test('returns one probability per round, all in [0, 1]', () => {
    const roundMatches: Record<Round, MatchId> = {
      R32: 'G74', R16: 'G89', QF: 'G97', SF: 'G101', Final: 'G104',
    };
    const opponentFeederRoots: Record<Round, MatchId | null> = {
      R32: null, R16: 'G77', QF: 'G90', SF: 'G98', Final: 'G102',
    };
    const chain = computeSurvivalChain(
      'GER',
      roundMatches,
      () => 'A',
      opponentFeederRoots,
      {},
      {},
      true,
    );
    for (const r of ['R32', 'R16', 'QF', 'SF', 'Final'] as const) {
      const p = chain[r];
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  test('strongest team has higher R32 win probability than weakest', () => {
    const roundMatches: Record<Round, MatchId> = {
      R32: 'G74', R16: 'G89', QF: 'G97', SF: 'G101', Final: 'G104',
    };
    const opponentFeederRoots: Record<Round, MatchId | null> = {
      R32: null, R16: 'G77', QF: 'G90', SF: 'G98', Final: 'G102',
    };
    // GER is a tournament heavyweight; KSA is one of the weakest.
    const strongChain = computeSurvivalChain(
      'GER', roundMatches, () => 'A', opponentFeederRoots, {}, {}, true,
    );
    const weakChain = computeSurvivalChain(
      'KSA', roundMatches, () => 'A', opponentFeederRoots, {}, {}, true,
    );
    expect(strongChain.R32).toBeGreaterThan(weakChain.R32);
  });
});

describe('isDeterministic', () => {
  test('empty distribution is considered deterministic (nothing to be uncertain about)', () => {
    expect(isDeterministic(new Map())).toBeTruthy();
  });

  test('single team with prob 1 is deterministic', () => {
    expect(isDeterministic(new Map([['ARG' as TeamCode, 1]]))).toBeTruthy();
  });

  test('single team with prob < 1 is NOT deterministic', () => {
    expect(isDeterministic(new Map([['ARG' as TeamCode, 0.7]]))).toBeFalsy();
  });

  test('two teams is NOT deterministic', () => {
    const d = new Map<TeamCode, number>([
      ['ARG' as TeamCode, 0.6],
      ['BRA' as TeamCode, 0.4],
    ]);
    expect(isDeterministic(d)).toBeFalsy();
  });
});

describe('sortedDist', () => {
  test('sorts by probability descending', () => {
    const d = new Map<TeamCode, number>([
      ['ARG' as TeamCode, 0.2],
      ['BRA' as TeamCode, 0.5],
      ['FRA' as TeamCode, 0.3],
    ]);
    const sorted = sortedDist(d);
    expect(sorted.map(([t]) => t)).toEqual(['BRA', 'FRA', 'ARG']);
  });

  test('empty distribution → empty array', () => {
    expect(sortedDist(new Map()).length).toBe(0);
  });
});

describe('matchIsOneVsThird', () => {
  test('detects G74 (1°E vs thirds)', () => {
    expect(matchIsOneVsThird('G74')).toBeTruthy();
  });

  test('returns false for G73 (2°A vs 2°B)', () => {
    expect(matchIsOneVsThird('G73')).toBeFalsy();
  });

  test('returns false for an R16 match', () => {
    expect(matchIsOneVsThird('G89')).toBeFalsy();
  });

  test('returns true for every R32 slot that pairs a 1° group with a thirds slot', () => {
    let anyTrue = false;
    for (const id of Object.keys(R32)) {
      const m = R32[id];
      const expectMatch =
        (m.A.kind === 'group' && m.A.pos === 1 && m.B.kind === 'thirds') ||
        (m.B.kind === 'group' && m.B.pos === 1 && m.A.kind === 'thirds');
      expect(matchIsOneVsThird(id)).toBe(expectMatch);
      if (expectMatch) anyTrue = true;
    }
    expect(anyTrue).toBeTruthy(); // sanity check the test isn't trivially passing
  });
});
