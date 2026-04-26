// Core domain types for the WCKO bracket tool.

export type GroupLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';
export type TeamCode = string;             // e.g. 'POR'
export type MatchId = string;              // e.g. 'G87'
export type SlotSide = 'A' | 'B';          // 'A' = top, 'B' = bottom
export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'Final';
export type GroupFinish = '1' | '2' | '3';

export interface Team {
  code: TeamCode;
  name: string;
  group: GroupLetter;
  iso2: string;                            // for flagcdn URL
}

export type SlotSpec =
  | { kind: 'group'; pos: 1 | 2; group: GroupLetter }
  | { kind: 'thirds'; groups: GroupLetter[] }
  | { kind: 'winnerOf'; matchId: MatchId };

export interface Match {
  A: SlotSpec;                             // top slot
  B: SlotSpec;                             // bottom slot
}

export interface R32SlotPosition {
  matchId: MatchId;
  side: SlotSide;
}

export interface Scenario {
  analyzedTeam: TeamCode | null;
  groupFinish: GroupFinish | null;
  thirdR32: MatchId | null;                // chosen R32 for 3° finish (when multiple options)
  autoAdvance: Record<Round, boolean>;     // kept for backward-compat; UI no longer toggles
  placements: Record<string, TeamCode>;    // key: 'matchId.side'
  odds: Record<MatchId, string>;           // explicit user-typed odds, value stored as string
  useEstimatedOdds: boolean;               // when true, unset matches use Bradley-Terry estimate
  scenarioName: string;
}

export type WinnerDist = Map<TeamCode, number>;

/**
 * Discriminated union for every kind of drop target the bracket UI exposes.
 * Attached to dnd-kit's `useDroppable({ data: ... })`. Reading the data in
 * the global drop handler narrows on `kind` so adding a new drop type is a
 * compile error until handleDragEnd handles it.
 */
export type DropTargetData =
  /** A specific R32 slot — accepts a team directly. */
  | { kind: 'slot'; matchId: MatchId; side: SlotSide }
  /**
   * The "your match" opponent slot on R16+ round cards. Drops resolve at
   * runtime to the eligible R32 leaf in the opponent feeder subtree.
   */
  | { kind: 'oppslot'; roundMatchId: MatchId };
