import { describe, expect, test } from '../../tests/runner';
import { MATCHES, R32, ROUND_OF, TREE } from '../data/bracket';
import { GROUPS } from '../data/teams';
import { eligibleForMatchSide, eligibleForSlot } from './eligibility';
import { collectSubtreeByRound } from './paths';
import type { GroupLetter, MatchId, SlotSide, TeamCode } from '../types';

describe('eligibleForSlot', () => {
  test('group slot → exactly the 4 teams in that group', () => {
    for (const g of Object.keys(GROUPS) as GroupLetter[]) {
      const set = eligibleForSlot({ kind: 'group', pos: 1, group: g });
      expect(set.size).toBe(4);
      for (const t of GROUPS[g]) expect(set.has(t)).toBeTruthy();
    }
  });

  test('group slot eligibility is independent of position 1 vs 2', () => {
    const a = eligibleForSlot({ kind: 'group', pos: 1, group: 'A' });
    const b = eligibleForSlot({ kind: 'group', pos: 2, group: 'A' });
    expect(a).toEqual(b);
  });

  test('thirds slot → union of teams across the eligible groups', () => {
    const set = eligibleForSlot({ kind: 'thirds', groups: ['A', 'B'] });
    expect(set.size).toBe(8);
    for (const t of GROUPS.A) expect(set.has(t)).toBeTruthy();
    for (const t of GROUPS.B) expect(set.has(t)).toBeTruthy();
  });

  test('thirds slot with one group equals that group set', () => {
    const set = eligibleForSlot({ kind: 'thirds', groups: ['C'] });
    expect(set.size).toBe(4);
    for (const t of GROUPS.C) expect(set.has(t)).toBeTruthy();
  });

  test('winnerOf slot → union of the upstream match\'s two slots', () => {
    // G89 = R16 with R32 children G74 (1°E vs thirds {ABCDF}) and G77 (1°I vs thirds {CDFGH}).
    // eligibleForSlot({winnerOf G89}) recurses into G89's slots, which are themselves
    // winnerOf G74 / winnerOf G77 → eventually unions teams from groups E, I,
    // and 3°-eligible groups A,B,C,D,F,G,H.
    const set = eligibleForSlot({ kind: 'winnerOf', matchId: 'G89' });
    // Sanity: must contain teams from group E (1°E flows into G74.A → G89)
    for (const t of GROUPS.E) expect(set.has(t)).toBeTruthy();
    for (const t of GROUPS.I) expect(set.has(t)).toBeTruthy();
  });

  test('winnerOf for the Final (G104) covers every team in the tournament', () => {
    const set = eligibleForSlot({ kind: 'winnerOf', matchId: 'G104' });
    expect(set.size).toBe(48);
    for (const teams of Object.values(GROUPS)) {
      for (const t of teams) expect(set.has(t)).toBeTruthy();
    }
  });

  test('cached: same slot spec returns the same Set instance', () => {
    const a = eligibleForSlot({ kind: 'group', pos: 1, group: 'A' });
    const b = eligibleForSlot({ kind: 'group', pos: 1, group: 'A' });
    expect(a).toBe(b);
  });
});

describe('eligibleForMatchSide', () => {
  test('R32 group slots: 4 teams from the group', () => {
    const set = eligibleForMatchSide('G73', 'A'); // 2°A
    expect(set.size).toBe(4);
    for (const t of GROUPS.A) expect(set.has(t)).toBeTruthy();
  });

  test('R32 thirds slots: union across the eligible groups', () => {
    // G74.B = thirds {A,B,C,D,F} → 5 groups × 4 teams = 20 teams
    const set = eligibleForMatchSide('G74', 'B');
    expect(set.size).toBe(20);
    for (const g of ['A', 'B', 'C', 'D', 'F'] as const) {
      for (const t of GROUPS[g]) expect(set.has(t)).toBeTruthy();
    }
  });

  test('every R32 leaf has a non-empty eligibility set', () => {
    for (const id of Object.keys(R32) as MatchId[]) {
      for (const side of ['A', 'B'] as const) {
        const set = eligibleForMatchSide(id, side);
        expect(set.size).toBeGreaterThan(0);
      }
    }
  });

  test('every team is eligible for at least one R32 slot somewhere', () => {
    const all = new Set<TeamCode>();
    for (const id of Object.keys(R32) as MatchId[]) {
      for (const side of ['A', 'B'] as const) {
        for (const t of eligibleForMatchSide(id, side)) all.add(t);
      }
    }
    expect(all.size).toBe(48);
  });

  test('R16+ match-side eligibility = union of subtree leaves', () => {
    // For each R16 match, verify that side A's eligibility = union of
    // its winnerOf-resolved leaves' A+B sides.
    for (const [parent, [a, b]] of Object.entries(TREE)) {
      const sideA = eligibleForMatchSide(parent, 'A');
      const sideB = eligibleForMatchSide(parent, 'B');
      // Side A of parent corresponds to subtree rooted at child A
      const expectedA = new Set<TeamCode>();
      const expectedB = new Set<TeamCode>();
      const subtreeA = collectSubtreeByRound(a);
      const subtreeB = collectSubtreeByRound(b);
      for (const leaf of subtreeA.R32) {
        for (const s of ['A', 'B'] as const) {
          for (const t of eligibleForMatchSide(leaf, s)) expectedA.add(t);
        }
      }
      for (const leaf of subtreeB.R32) {
        for (const s of ['A', 'B'] as const) {
          for (const t of eligibleForMatchSide(leaf, s)) expectedB.add(t);
        }
      }
      expect(sideA).toEqual(expectedA);
      expect(sideB).toEqual(expectedB);
    }
  });
});

describe('drag-drop invariants', () => {
  test('a team eligible at a leaf is eligible at every ancestor on the same side', () => {
    // Spot-check: BRA is in group C. 1°C → G76.A. So BRA is eligible at G76.A.
    // G76 is child A of G91 → BRA eligible at G91.A.
    // G91 is child B of G99 → BRA eligible at G99.B.
    // G99 is child A of G102 → BRA eligible at G102.A.
    // G102 is child B of G104 → BRA eligible at G104.B.
    const bra: TeamCode = 'BRA';
    expect(eligibleForMatchSide('G76', 'A').has(bra)).toBeTruthy();
    expect(eligibleForMatchSide('G91', 'A').has(bra)).toBeTruthy();
    expect(eligibleForMatchSide('G99', 'B').has(bra)).toBeTruthy();
    expect(eligibleForMatchSide('G102', 'A').has(bra)).toBeTruthy();
    expect(eligibleForMatchSide('G104', 'B').has(bra)).toBeTruthy();
  });

  test('R32 leaf slots in the same R16 don\'t share group teams (except thirds overlap)', () => {
    // For non-thirds R32 slots: the four group slots within a single R16 should
    // come from distinct groups (no team can be eligible at two of them).
    for (const [r16, [a, b]] of Object.entries(TREE)) {
      if (ROUND_OF[r16] !== 'R16') continue;
      const slots: Array<[MatchId, SlotSide]> = [
        [a, 'A'], [a, 'B'], [b, 'A'], [b, 'B'],
      ];
      // Only check group-vs-group overlap (skip when either slot is thirds)
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const [m1, s1] = slots[i];
          const [m2, s2] = slots[j];
          const sp1 = MATCHES[m1][s1];
          const sp2 = MATCHES[m2][s2];
          if (sp1.kind !== 'group' || sp2.kind !== 'group') continue;
          // Group slots can only overlap if they're the same (group, pos);
          // distinct group slots should have disjoint eligibility.
          const overlap = [...eligibleForMatchSide(m1, s1)].filter(t =>
            eligibleForMatchSide(m2, s2).has(t),
          );
          if (sp1.group === sp2.group && sp1.pos === sp2.pos) continue;
          expect(overlap.length).toBe(0);
        }
      }
    }
  });
});
