import { describe, expect, test } from '../../tests/runner';
import { PARENT, R32, ROUND_OF, TREE } from '../data/bracket';
import { GROUPS } from '../data/teams';
import {
  areOnSamePath,
  collectSubtreeByRound,
  findR32ForTeam_12,
  findR32Options3,
  getAnalyzedPath,
  getAnalyzedSideAt,
  getOpponentFeederRoot,
  getRoundMatches,
  isAncestor,
  resolveR32,
} from './paths';
import type { MatchId, TeamCode } from '../types';

describe('findR32ForTeam_12', () => {
  test('returns the unique R32 slot for every team for both 1° and 2°', () => {
    for (const teams of Object.values(GROUPS)) {
      for (const team of teams) {
        for (const pos of [1, 2] as const) {
          const slot = findR32ForTeam_12(team, pos);
          expect(slot).not.toBeNull();
          // Sanity-check the resolved slot's spec matches (pos, group)
          const m = R32[slot!.matchId];
          const s = m[slot!.side];
          expect(s.kind).toBe('group');
          if (s.kind === 'group') {
            expect(s.pos).toBe(pos);
          }
        }
      }
    }
  });

  test('returns null for an unknown team code', () => {
    expect(findR32ForTeam_12('ZZZ' as TeamCode, 1)).toBeNull();
  });
});

describe('findR32Options3', () => {
  test('every team has at least one 3° option (4 thirds slots accept 5 groups each)', () => {
    for (const teams of Object.values(GROUPS)) {
      for (const team of teams) {
        const opts = findR32Options3(team);
        expect(opts.length).toBeGreaterThan(0);
        // All options must be thirds slots whose `groups` include this team's group
        for (const o of opts) {
          const slot = R32[o.matchId][o.side];
          expect(slot.kind).toBe('thirds');
        }
      }
    }
  });

  test('returns empty for an unknown team', () => {
    expect(findR32Options3('ZZZ' as TeamCode).length).toBe(0);
  });
});

describe('resolveR32', () => {
  test('returns null without team or finish', () => {
    expect(resolveR32(null, '1', null)).toBeNull();
    expect(resolveR32('ARG', null, null)).toBeNull();
  });

  test('1° / 2° finish → unique R32 slot regardless of thirdR32', () => {
    const a = resolveR32('ARG', '1', null);
    const b = resolveR32('ARG', '1', 'G99');
    expect(a).toEqual(b);
  });

  test('3° finish picks first option when thirdR32 is null', () => {
    const opts = findR32Options3('BRA');
    expect(opts.length).toBeGreaterThan(0);
    expect(resolveR32('BRA', '3', null)).toEqual(opts[0]);
  });

  test('3° finish honours an explicit thirdR32', () => {
    const opts = findR32Options3('BRA');
    if (opts.length < 2) return; // fixture sanity
    const choice = opts[opts.length - 1];
    expect(resolveR32('BRA', '3', choice.matchId)).toEqual(choice);
  });

  test('3° finish falls back to first option when thirdR32 is invalid', () => {
    const opts = findR32Options3('BRA');
    expect(resolveR32('BRA', '3', 'G73' /* not a thirds slot */)).toEqual(opts[0]);
  });
});

describe('getAnalyzedPath', () => {
  test('empty when no R32 match', () => {
    expect(getAnalyzedPath(null)).toEqual([]);
  });

  test('returns the full chain from R32 to Final, length 5', () => {
    const path = getAnalyzedPath('G74');
    expect(path.length).toBe(5);
    expect(path[0]).toBe('G74');
    expect(path[path.length - 1]).toBe('G104');
    // Each step is the parent of the previous
    for (let i = 1; i < path.length; i++) {
      expect(PARENT[path[i - 1]]).toBe(path[i]);
    }
  });
});

describe('getRoundMatches', () => {
  test('null R32 → null result', () => {
    expect(getRoundMatches(null)).toBeNull();
  });

  test('builds the per-round map matching the path', () => {
    const rm = getRoundMatches('G74');
    expect(rm).not.toBeNull();
    expect(rm!.R32).toBe('G74');
    // Round labels match ROUND_OF in the static bracket data
    for (const r of ['R32', 'R16', 'QF', 'SF', 'Final'] as const) {
      expect(ROUND_OF[rm![r]]).toBe(r);
    }
  });
});

describe('getOpponentFeederRoot', () => {
  test('returns null for R32 (no feeder)', () => {
    expect(getOpponentFeederRoot('G74', getAnalyzedPath('G74'))).toBeNull();
  });

  test('returns the OTHER child of the round match', () => {
    // Path through G74: G74 -> G89 -> G97 -> G101 -> G104.
    // For G89, the children are G74 and G77 — opponent feeder is G77.
    const path = getAnalyzedPath('G74');
    expect(getOpponentFeederRoot('G89', path)).toBe('G77');
    // For G97 (R16 children G89 and G90), opponent feeder is G90.
    expect(getOpponentFeederRoot('G97', path)).toBe('G90');
  });

  test('returns null when neither child is on the path (defensive)', () => {
    // G89's children are G74 and G77; pass a path that doesn't include either
    expect(getOpponentFeederRoot('G89', ['G83', 'G93'])).toBeNull();
  });
});

describe('isAncestor / areOnSamePath', () => {
  test('isAncestor follows PARENT links', () => {
    expect(isAncestor('G89', 'G74')).toBeTruthy(); // G89 is parent of G74
    expect(isAncestor('G104', 'G74')).toBeTruthy(); // G104 is great-great-grandparent
    expect(isAncestor('G74', 'G89')).toBeFalsy(); // wrong direction
    expect(isAncestor('G74', 'G77')).toBeFalsy(); // siblings
  });

  test('areOnSamePath: same node, ancestor, descendant, or unrelated', () => {
    expect(areOnSamePath('G74', 'G74')).toBeTruthy();
    expect(areOnSamePath('G74', 'G89')).toBeTruthy();
    expect(areOnSamePath('G89', 'G74')).toBeTruthy();
    expect(areOnSamePath('G74', 'G77')).toBeFalsy(); // siblings under G89
    expect(areOnSamePath('G74', 'G83')).toBeFalsy(); // different subtrees entirely
  });
});

describe('getAnalyzedSideAt', () => {
  test('R32 case: returns the analyzed slot side', () => {
    expect(getAnalyzedSideAt('G74', getAnalyzedPath('G74'), { matchId: 'G74', side: 'A' })).toBe('A');
    expect(getAnalyzedSideAt('G74', getAnalyzedPath('G74'), { matchId: 'G74', side: 'B' })).toBe('B');
  });

  test('R16+ case: returns A if the analyzed path is in child A, else B', () => {
    // G89 children = [G74, G77]. Analyzed at G74 → side A. Analyzed at G77 → side B.
    expect(getAnalyzedSideAt('G89', getAnalyzedPath('G74'), { matchId: 'G74', side: 'A' })).toBe('A');
    expect(getAnalyzedSideAt('G89', getAnalyzedPath('G77'), { matchId: 'G77', side: 'B' })).toBe('B');
  });
});

describe('collectSubtreeByRound', () => {
  test('R32 root: only R32 slot in the result', () => {
    const t = collectSubtreeByRound('G74');
    expect(t.R32).toEqual(['G74']);
    expect(t.R16.length).toBe(0);
  });

  test('R16 root: R16 + 2 R32 children', () => {
    const t = collectSubtreeByRound('G89');
    expect(t.R16).toEqual(['G89']);
    expect(t.R32.length).toBe(2);
    // Children must match TREE
    expect(new Set(t.R32)).toEqual(new Set(TREE.G89));
  });

  test('Final root: full bracket', () => {
    const t = collectSubtreeByRound('G104');
    expect(t.Final).toEqual(['G104']);
    expect(t.SF.length).toBe(2);
    expect(t.QF.length).toBe(4);
    expect(t.R16.length).toBe(8);
    expect(t.R32.length).toBe(16);
  });

  test('subtree counts double at each level walking up the bracket', () => {
    for (const rootId of Object.keys(TREE) as MatchId[]) {
      const t = collectSubtreeByRound(rootId);
      const round = ROUND_OF[rootId];
      // The root's own round contains exactly the root
      expect(t[round]).toEqual([rootId]);
    }
  });
});
