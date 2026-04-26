import { describe, expect, test } from '../../tests/runner';
import { GROUPS } from './teams';
import {
  bradleyTerryTopWins,
  positionProbabilities,
  simulateGroup,
  thirdsCandidateDistribution,
  WC_WIN_PROB,
} from './odds';

describe('bradleyTerryTopWins', () => {
  test('returns a value in [1, 99] for two known teams', () => {
    const v = bradleyTerryTopWins('ARG', 'BRA');
    expect(v).not.toBeNull();
    expect(v as number).toBeGreaterThanOrEqual(1);
    expect(v as number).toBeLessThanOrEqual(99);
  });

  test('symmetric: BT(A,B) + BT(B,A) === 100 (after rounding)', () => {
    // Pick a few representative pairs across the strength spectrum.
    const pairs: Array<[string, string]> = [
      ['ARG', 'BRA'],
      ['ESP', 'JOR'],
      ['FRA', 'KSA'],
      ['NED', 'GHA'],
    ];
    for (const [a, b] of pairs) {
      const ab = bradleyTerryTopWins(a, b);
      const ba = bradleyTerryTopWins(b, a);
      expect(ab).not.toBeNull();
      expect(ba).not.toBeNull();
      // Sum should be 100 ± 1 (rounding to integer can produce ±1 drift).
      const sum = (ab as number) + (ba as number);
      expect(sum).toBeGreaterThanOrEqual(99);
      expect(sum).toBeLessThanOrEqual(101);
    }
  });

  test('the stronger team gets > 50%', () => {
    // Pick the strongest team in WC_WIN_PROB and the weakest with non-zero prob.
    const entries = Object.entries(WC_WIN_PROB) as Array<[string, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    const strongest = entries[0][0];
    const weakest = [...entries].reverse().find(([, p]) => p > 0)![0];
    const v = bradleyTerryTopWins(strongest, weakest);
    expect(v).not.toBeNull();
    expect(v as number).toBeGreaterThan(50);
  });

  test('clamps to [1, 99] even for huge mismatches', () => {
    const entries = Object.entries(WC_WIN_PROB) as Array<[string, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    const strongest = entries[0][0];
    const weakest = [...entries].reverse().find(([, p]) => p > 0)![0];
    const top = bradleyTerryTopWins(strongest, weakest);
    const bot = bradleyTerryTopWins(weakest, strongest);
    expect(top).not.toBeNull();
    expect(bot).not.toBeNull();
    expect(top as number).toBeLessThanOrEqual(99);
    expect(bot as number).toBeGreaterThanOrEqual(1);
  });

  test('returns null when either team has no recorded probability', () => {
    expect(bradleyTerryTopWins('ZZZ' as never, 'ARG')).toBeNull();
    expect(bradleyTerryTopWins('ARG', 'ZZZ' as never)).toBeNull();
  });
});

describe('simulateGroup', () => {
  test('contains exactly the 4 teams of the group', () => {
    const sim = simulateGroup('A');
    expect(sim.size).toBe(4);
    for (const t of GROUPS.A) expect(sim.has(t)).toBeTruthy();
  });

  test('per-team probabilities sum to 1 (team always finishes somewhere)', () => {
    for (const g of Object.keys(GROUPS) as Array<keyof typeof GROUPS>) {
      const sim = simulateGroup(g);
      for (const [, probs] of sim) {
        const sum = probs.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1, 5);
      }
    }
  });

  test('per-position columns sum to 1 (exactly one team holds each position)', () => {
    for (const g of Object.keys(GROUPS) as Array<keyof typeof GROUPS>) {
      const sim = simulateGroup(g);
      for (let pos = 0; pos < 4; pos++) {
        let colSum = 0;
        for (const [, probs] of sim) colSum += probs[pos];
        expect(colSum).toBeCloseTo(1, 5);
      }
    }
  });

  test('strongest team in the group has the highest 1° probability', () => {
    for (const g of Object.keys(GROUPS) as Array<keyof typeof GROUPS>) {
      const teams = GROUPS[g];
      const strongestInGroup = teams
        .slice()
        .sort((a, b) => (WC_WIN_PROB[b] ?? 0) - (WC_WIN_PROB[a] ?? 0))[0];
      const sim = simulateGroup(g);
      const sorted = [...sim.entries()].sort((a, b) => b[1][0] - a[1][0]);
      expect(sorted[0][0]).toBe(strongestInGroup);
    }
  });

  test('cached: same call returns the same Map instance', () => {
    const a = simulateGroup('B');
    const b = simulateGroup('B');
    expect(a).toBe(b);
  });
});

describe('positionProbabilities', () => {
  test('sums to 1 across teams in the group', () => {
    for (const g of Object.keys(GROUPS) as Array<keyof typeof GROUPS>) {
      for (const pos of [1, 2, 3, 4] as const) {
        const dist = positionProbabilities(g, pos);
        let sum = 0;
        for (const v of dist.values()) sum += v;
        expect(sum).toBeCloseTo(1, 5);
      }
    }
  });

  test('contains exactly the teams in the group', () => {
    const dist = positionProbabilities('C', 1);
    expect(dist.size).toBe(4);
    for (const t of GROUPS.C) expect(dist.has(t)).toBeTruthy();
  });
});

describe('thirdsCandidateDistribution', () => {
  test('empty input returns empty map', () => {
    const d = thirdsCandidateDistribution([]);
    expect(d.size).toBe(0);
  });

  test('sums to 1 (one team will be the 3° finisher in this slot)', () => {
    // Try each thirds-slot eligibility group from R32.
    const groupSets: Array<Array<keyof typeof GROUPS>> = [
      ['A', 'B', 'C', 'D', 'F'],
      ['C', 'D', 'F', 'G', 'H'],
      ['C', 'E', 'F', 'H', 'I'],
      ['E', 'H', 'I', 'J', 'K'],
      ['B', 'E', 'F', 'I', 'J'],
    ];
    for (const gs of groupSets) {
      const d = thirdsCandidateDistribution(gs);
      let sum = 0;
      for (const v of d.values()) sum += v;
      expect(sum).toBeCloseTo(1, 5);
    }
  });

  test('only contains teams from the eligible groups', () => {
    const groups: Array<keyof typeof GROUPS> = ['A', 'B'];
    const d = thirdsCandidateDistribution(groups);
    const eligible = new Set([...GROUPS.A, ...GROUPS.B]);
    for (const team of d.keys()) {
      expect(eligible.has(team)).toBeTruthy();
    }
  });

  test('no team is eligible from an excluded group', () => {
    const d = thirdsCandidateDistribution(['A', 'B']);
    for (const t of GROUPS.C) expect(d.has(t)).toBeFalsy();
  });
});
