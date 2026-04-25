import { PARENT, R32, ROUND_OF, TREE } from '../data/bracket';
import { TEAM_BY_CODE } from '../data/teams';
import type { GroupFinish, MatchId, R32SlotPosition, Round, TeamCode } from '../types';

// Find the analyzed team's R32 match for finish '1' or '2' (single result)
export function findR32ForTeam_12(teamCode: TeamCode, pos: 1 | 2): R32SlotPosition | null {
  const team = TEAM_BY_CODE[teamCode];
  if (!team) return null;
  for (const [id, m] of Object.entries(R32)) {
    for (const side of ['A', 'B'] as const) {
      const s = m[side];
      if (s.kind === 'group' && s.pos === pos && s.group === team.group) {
        return { matchId: id, side };
      }
    }
  }
  return null;
}

// Find all eligible R32 matches for 3° finish (a Group-X 3°-team can land in any
// thirds slot whose `groups` list includes X; multiple options can exist).
export function findR32Options3(teamCode: TeamCode): R32SlotPosition[] {
  const team = TEAM_BY_CODE[teamCode];
  if (!team) return [];
  const opts: R32SlotPosition[] = [];
  for (const [id, m] of Object.entries(R32)) {
    for (const side of ['A', 'B'] as const) {
      const s = m[side];
      if (s.kind === 'thirds' && s.groups.includes(team.group)) {
        opts.push({ matchId: id, side });
      }
    }
  }
  return opts;
}

export function resolveR32(teamCode: TeamCode | null, finish: GroupFinish | null, thirdR32: MatchId | null): R32SlotPosition | null {
  if (!teamCode || !finish) return null;
  if (finish === '1' || finish === '2') {
    return findR32ForTeam_12(teamCode, Number(finish) as 1 | 2);
  }
  // 3° finish
  const opts = findR32Options3(teamCode);
  if (opts.length === 0) return null;
  if (thirdR32) {
    const found = opts.find(o => o.matchId === thirdR32);
    if (found) return found;
  }
  return opts[0];
}

// Path of analyzed team from R32 to Final, inclusive.
export function getAnalyzedPath(r32MatchId: MatchId | null): MatchId[] {
  if (!r32MatchId) return [];
  const path = [r32MatchId];
  let cur = r32MatchId;
  while (PARENT[cur]) {
    cur = PARENT[cur];
    path.push(cur);
  }
  return path;
}

// For each round, the match the analyzed team plays in.
export function getRoundMatches(r32MatchId: MatchId | null): Record<Round, MatchId> | null {
  if (!r32MatchId) return null;
  const result: Partial<Record<Round, MatchId>> = { R32: r32MatchId };
  let cur = r32MatchId;
  for (const r of ['R16', 'QF', 'SF', 'Final'] as const) {
    cur = PARENT[cur];
    result[r] = cur;
  }
  return result as Record<Round, MatchId>;
}

// For a given round-N match on the analyzed path, the OTHER child = opponent feeder root.
// Returns null for R32 (no feeder, opponent is the other slot of M_R32 directly).
export function getOpponentFeederRoot(roundMatchId: MatchId, analyzedPath: MatchId[]): MatchId | null {
  const children = TREE[roundMatchId];
  if (!children) return null;
  const [a, b] = children;
  if (analyzedPath.includes(a)) return b;
  if (analyzedPath.includes(b)) return a;
  return null;
}

// Walk PARENT links to determine ancestry.
export function isAncestor(ancestor: MatchId, descendant: MatchId): boolean {
  let cur = descendant;
  while (PARENT[cur]) {
    cur = PARENT[cur];
    if (cur === ancestor) return true;
  }
  return false;
}

export function areOnSamePath(a: MatchId, b: MatchId): boolean {
  return a === b || isAncestor(a, b) || isAncestor(b, a);
}

// Determine which side of `roundMatchId` the analyzed team occupies.
export function getAnalyzedSideAt(roundMatchId: MatchId, analyzedPath: MatchId[], r32: R32SlotPosition | null): 'A' | 'B' {
  if (!r32) return 'A';
  if (roundMatchId === r32.matchId) return r32.side;
  const children = TREE[roundMatchId];
  if (!children) return 'A';
  const [a, b] = children;
  if (analyzedPath.includes(a)) return 'A';
  if (analyzedPath.includes(b)) return 'B';
  return 'A';
}

// Collect all matches in subtree rooted at `rootId`, grouped by round.
export function collectSubtreeByRound(rootId: MatchId): Record<Round, MatchId[]> {
  const byRound: Record<Round, MatchId[]> = { R32: [], R16: [], QF: [], SF: [], Final: [] };
  function walk(id: MatchId) {
    byRound[ROUND_OF[id]].push(id);
    const ch = TREE[id];
    if (ch) { walk(ch[0]); walk(ch[1]); }
  }
  walk(rootId);
  return byRound;
}
