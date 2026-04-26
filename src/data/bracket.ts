import type { Match, MatchId, Round, SlotSpec } from '../types';

// R32 match slot specs (G76 corrected to 1°C vs 2°F per spec note in §7.2)
export const R32: Record<MatchId, Match> = {
  G73: { A: { kind: 'group', pos: 2, group: 'A' }, B: { kind: 'group', pos: 2, group: 'B' } },
  G74: { A: { kind: 'group', pos: 1, group: 'E' }, B: { kind: 'thirds', groups: ['A','B','C','D','F'] } },
  G75: { A: { kind: 'group', pos: 1, group: 'F' }, B: { kind: 'group', pos: 2, group: 'C' } },
  G76: { A: { kind: 'group', pos: 1, group: 'C' }, B: { kind: 'group', pos: 2, group: 'F' } },
  G77: { A: { kind: 'group', pos: 1, group: 'I' }, B: { kind: 'thirds', groups: ['C','D','F','G','H'] } },
  G78: { A: { kind: 'group', pos: 2, group: 'E' }, B: { kind: 'group', pos: 2, group: 'I' } },
  G79: { A: { kind: 'group', pos: 1, group: 'A' }, B: { kind: 'thirds', groups: ['C','E','F','H','I'] } },
  G80: { A: { kind: 'group', pos: 1, group: 'L' }, B: { kind: 'thirds', groups: ['E','H','I','J','K'] } },
  G81: { A: { kind: 'group', pos: 1, group: 'D' }, B: { kind: 'thirds', groups: ['B','E','F','I','J'] } },
  G82: { A: { kind: 'group', pos: 1, group: 'G' }, B: { kind: 'thirds', groups: ['A','E','H','I','J'] } },
  G83: { A: { kind: 'group', pos: 2, group: 'K' }, B: { kind: 'group', pos: 2, group: 'L' } },
  G84: { A: { kind: 'group', pos: 1, group: 'H' }, B: { kind: 'group', pos: 2, group: 'J' } },
  G85: { A: { kind: 'group', pos: 1, group: 'B' }, B: { kind: 'thirds', groups: ['E','F','G','I','J'] } },
  G86: { A: { kind: 'group', pos: 1, group: 'J' }, B: { kind: 'group', pos: 2, group: 'H' } },
  G87: { A: { kind: 'group', pos: 1, group: 'K' }, B: { kind: 'thirds', groups: ['D','E','I','J','L'] } },
  G88: { A: { kind: 'group', pos: 2, group: 'D' }, B: { kind: 'group', pos: 2, group: 'G' } },
};

// Bracket tree: parent -> [topChild, bottomChild]
export const TREE: Record<MatchId, [MatchId, MatchId]> = {
  G89: ['G74', 'G77'],
  G90: ['G73', 'G75'],
  G91: ['G76', 'G78'],
  G92: ['G79', 'G80'],
  G93: ['G83', 'G84'],
  G94: ['G81', 'G82'],
  G95: ['G86', 'G88'],
  G96: ['G85', 'G87'],
  G97: ['G89', 'G90'],
  G98: ['G93', 'G94'],
  G99: ['G91', 'G92'],
  G100: ['G95', 'G96'],
  G101: ['G97', 'G98'],
  G102: ['G99', 'G100'],
  G104: ['G101', 'G102'],
};

// child -> parent (used to walk a match up to the Final).
export const PARENT: Record<MatchId, MatchId> = {};
for (const [parent, [a, b]] of Object.entries(TREE)) {
  PARENT[a] = parent;
  PARENT[b] = parent;
}

// Round of each match
export const ROUND_OF: Record<MatchId, Round> = {};
Object.keys(R32).forEach(id => { ROUND_OF[id] = 'R32'; });
['G89','G90','G91','G92','G93','G94','G95','G96'].forEach(id => { ROUND_OF[id] = 'R16'; });
['G97','G98','G99','G100'].forEach(id => { ROUND_OF[id] = 'QF'; });
['G101','G102'].forEach(id => { ROUND_OF[id] = 'SF'; });
ROUND_OF['G104'] = 'Final';

export const ROUND_ORDER: Round[] = ['R32', 'R16', 'QF', 'SF', 'Final'];

export const ROUND_LABEL: Record<Round, string> = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-final',
  SF: 'Semi-final',
  Final: 'Final',
};

// All matches lookup: R32 explicit, R16+ derived as winnerOf
export const MATCHES: Record<MatchId, Match> = (() => {
  const m: Record<MatchId, Match> = { ...R32 };
  for (const [id, [a, b]] of Object.entries(TREE)) {
    m[id] = { A: { kind: 'winnerOf', matchId: a }, B: { kind: 'winnerOf', matchId: b } };
  }
  return m;
})();

export function slotLabel(slot: SlotSpec): string {
  if (slot.kind === 'group') return `${slot.pos}°${slot.group}`;
  if (slot.kind === 'thirds') return `3° {${slot.groups.join(',')}}`;
  return `Winner ${slot.matchId}`;
}
