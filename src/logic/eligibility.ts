import { MATCHES } from '../data/bracket';
import { GROUPS } from '../data/teams';
import type { MatchId, SlotSide, SlotSpec, TeamCode } from '../types';

const CACHE = new Map<string, Set<TeamCode>>();

export function eligibleForSlot(slot: SlotSpec): Set<TeamCode> {
  const key = JSON.stringify(slot);
  const hit = CACHE.get(key);
  if (hit) return hit;

  let result: Set<TeamCode>;
  if (slot.kind === 'group') {
    result = new Set(GROUPS[slot.group]);
  } else if (slot.kind === 'thirds') {
    result = new Set(slot.groups.flatMap(g => GROUPS[g]));
  } else {
    const m = MATCHES[slot.matchId];
    const a = eligibleForSlot(m.A);
    const b = eligibleForSlot(m.B);
    result = new Set<TeamCode>([...a, ...b]);
  }
  CACHE.set(key, result);
  return result;
}

export function eligibleForMatchSide(matchId: MatchId, side: SlotSide): Set<TeamCode> {
  return eligibleForSlot(MATCHES[matchId][side]);
}
