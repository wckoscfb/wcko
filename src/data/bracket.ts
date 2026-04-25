import type { Match, MatchId, Round, SlotSide, SlotSpec } from '../types';

// R32 match slot specs (P76 corrected to 1°C vs 2°F per spec note in §7.2)
export const R32: Record<MatchId, Match> = {
  P73: { A: { kind: 'group', pos: 2, group: 'A' }, B: { kind: 'group', pos: 2, group: 'B' } },
  P74: { A: { kind: 'group', pos: 1, group: 'E' }, B: { kind: 'thirds', groups: ['A','B','C','D','F'] } },
  P75: { A: { kind: 'group', pos: 1, group: 'F' }, B: { kind: 'group', pos: 2, group: 'C' } },
  P76: { A: { kind: 'group', pos: 1, group: 'C' }, B: { kind: 'group', pos: 2, group: 'F' } },
  P77: { A: { kind: 'group', pos: 1, group: 'I' }, B: { kind: 'thirds', groups: ['C','D','F','G','H'] } },
  P78: { A: { kind: 'group', pos: 2, group: 'E' }, B: { kind: 'group', pos: 2, group: 'I' } },
  P79: { A: { kind: 'group', pos: 1, group: 'A' }, B: { kind: 'thirds', groups: ['C','E','F','H','I'] } },
  P80: { A: { kind: 'group', pos: 1, group: 'L' }, B: { kind: 'thirds', groups: ['E','H','I','J','K'] } },
  P81: { A: { kind: 'group', pos: 1, group: 'D' }, B: { kind: 'thirds', groups: ['B','E','F','I','J'] } },
  P82: { A: { kind: 'group', pos: 1, group: 'G' }, B: { kind: 'thirds', groups: ['A','E','H','I','J'] } },
  P83: { A: { kind: 'group', pos: 2, group: 'K' }, B: { kind: 'group', pos: 2, group: 'L' } },
  P84: { A: { kind: 'group', pos: 1, group: 'H' }, B: { kind: 'group', pos: 2, group: 'J' } },
  P85: { A: { kind: 'group', pos: 1, group: 'B' }, B: { kind: 'thirds', groups: ['E','F','G','I','J'] } },
  P86: { A: { kind: 'group', pos: 1, group: 'J' }, B: { kind: 'group', pos: 2, group: 'H' } },
  P87: { A: { kind: 'group', pos: 1, group: 'K' }, B: { kind: 'thirds', groups: ['D','E','I','J','L'] } },
  P88: { A: { kind: 'group', pos: 2, group: 'D' }, B: { kind: 'group', pos: 2, group: 'G' } },
};

// Bracket tree: parent -> [topChild, bottomChild]
export const TREE: Record<MatchId, [MatchId, MatchId]> = {
  P89: ['P74', 'P77'],
  P90: ['P73', 'P75'],
  P91: ['P76', 'P78'],
  P92: ['P79', 'P80'],
  P93: ['P83', 'P84'],
  P94: ['P81', 'P82'],
  P95: ['P86', 'P88'],
  P96: ['P85', 'P87'],
  P97: ['P89', 'P90'],
  P98: ['P93', 'P94'],
  P99: ['P91', 'P92'],
  P100: ['P95', 'P96'],
  P101: ['P97', 'P98'],
  P102: ['P99', 'P100'],
  P104: ['P101', 'P102'],
};

// child -> parent and side it occupies in parent
export const PARENT: Record<MatchId, MatchId> = {};
export const SIDE_OF: Record<MatchId, SlotSide> = {};
for (const [parent, [a, b]] of Object.entries(TREE)) {
  PARENT[a] = parent; SIDE_OF[a] = 'A';
  PARENT[b] = parent; SIDE_OF[b] = 'B';
}

// Round of each match
export const ROUND_OF: Record<MatchId, Round> = {};
Object.keys(R32).forEach(id => { ROUND_OF[id] = 'R32'; });
['P89','P90','P91','P92','P93','P94','P95','P96'].forEach(id => { ROUND_OF[id] = 'R16'; });
['P97','P98','P99','P100'].forEach(id => { ROUND_OF[id] = 'QF'; });
['P101','P102'].forEach(id => { ROUND_OF[id] = 'SF'; });
ROUND_OF['P104'] = 'Final';

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
