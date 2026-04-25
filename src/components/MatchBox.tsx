import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MATCHES, slotLabel } from '../data/bracket';
import { TEAM_BY_CODE } from '../data/teams';
import { bradleyTerryTopWins } from '../data/odds';
import { eligibleForMatchSide } from '../logic/eligibility';
import { matchIsOneVsThird } from '../logic/probability';
import type { MatchId, SlotSide, TeamCode } from '../types';
import { FlagImg } from './FlagImg';

export interface MatchBoxProps {
  matchId: MatchId;
  placements: Record<string, TeamCode>;
  odds: Record<MatchId, string>;
  draggedTeam: TeamCode | null;
  onClear: (matchId: MatchId, side: SlotSide) => void;
  onOddsChange: (matchId: MatchId, value: string) => void;
  showOdds?: boolean;
  lockedSlot?: SlotSide | null;
}

interface SlotProps {
  matchId: MatchId;
  side: SlotSide;
  placements: Record<string, TeamCode>;
  draggedTeam: TeamCode | null;
  onClear: (matchId: MatchId, side: SlotSide) => void;
  isLocked: boolean;
}

function Slot({ matchId, side, placements, draggedTeam, onClear, isLocked }: SlotProps) {
  const m = MATCHES[matchId];
  const slot = m[side];
  const placed = placements[`${matchId}.${side}`];
  const eligible = eligibleForMatchSide(matchId, side);
  const canDrop = !!draggedTeam && eligible.has(draggedTeam) && !isLocked;
  const isThirdsFaded = slot.kind === 'thirds' && !placed;

  // Drop target
  const dropId = `slot:${matchId}:${side}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { matchId, side },
    disabled: isLocked || (!!draggedTeam && !canDrop),
  });

  // Drag source for the placed flag
  const dragId = `placed:${matchId}:${side}`;
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { team: placed, originSlot: { matchId, side } },
    disabled: !placed || isLocked,
  });

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div
      ref={setDropRef}
      className={`slot-base flex items-center gap-2 px-2 min-h-[28px] sm:min-h-[26px] text-xs ${
        placed ? 'slot-filled' : 'slot-empty'
      } ${canDrop ? 'slot-eligible' : ''} ${isOver && canDrop ? 'ring-2 ring-blue-500' : ''} ${
        isThirdsFaded ? 'opacity-70' : ''
      } ${isLocked ? 'bg-blue-50 border-blue-300' : ''}`}
    >
      {placed ? (
        <>
          <div
            ref={setDragRef}
            {...listeners}
            {...attributes}
            style={dragStyle}
            className={`no-callout flex items-center gap-2 flex-1 min-w-0 py-1 ${
              !isLocked ? 'cursor-grab active:cursor-grabbing touch-none' : ''
            }`}
            title={isLocked ? TEAM_BY_CODE[placed].name : `Drag ${TEAM_BY_CODE[placed].name} to next round`}
          >
            <FlagImg code={placed} />
            <span className="flex-1 truncate">{TEAM_BY_CODE[placed].name}</span>
          </div>
          {isLocked ? (
            <span className="text-[10px] text-blue-600 font-semibold">YOU</span>
          ) : (
            <button
              onClick={() => onClear(matchId, side)}
              onContextMenu={(e) => { e.preventDefault(); onClear(matchId, side); }}
              className="text-gray-400 hover:text-red-600 text-xs px-1 py-1"
              title="Clear slot"
              aria-label="Clear slot"
            >✕</button>
          )}
        </>
      ) : (
        <span className="text-gray-500 italic flex-1 truncate py-1" title={slotLabel(slot)}>
          {slotLabel(slot)}{slot.kind === 'thirds' ? ' (any)' : ''}
        </span>
      )}
    </div>
  );
}

export function MatchBox({
  matchId,
  placements,
  odds,
  draggedTeam,
  onClear,
  onOddsChange,
  showOdds = true,
  lockedSlot = null,
}: MatchBoxProps) {
  const m = MATCHES[matchId];
  const topPlaced = placements[`${matchId}.A`];
  const botPlaced = placements[`${matchId}.B`];
  const oddsVal = odds[matchId];
  const isOneVsThird = matchIsOneVsThird(matchId);

  // Bradley-Terry estimate shown as placeholder text whenever both slots are
  // filled and both teams are in the WC win-probability table. The same value
  // drives the actual computation when the user hasn't typed an explicit odds.
  const estimatedOdds = topPlaced && botPlaced
    ? bradleyTerryTopWins(topPlaced, botPlaced)
    : null;

  return (
    <div className="border border-gray-300 bg-white rounded shadow-sm w-44 sm:w-48 flex-shrink-0">
      <div className="text-[10px] text-gray-500 px-2 py-0.5 border-b bg-gray-50 flex justify-between">
        <span className="font-mono font-semibold">{matchId}</span>
        {isOneVsThird && (
          <span className="text-gray-400" title="1° vs 3° auto-resolves to 1° unless contradicted">
            auto→1°
          </span>
        )}
      </div>
      <Slot
        matchId={matchId}
        side="A"
        placements={placements}
        draggedTeam={draggedTeam}
        onClear={onClear}
        isLocked={lockedSlot === 'A'}
      />
      <Slot
        matchId={matchId}
        side="B"
        placements={placements}
        draggedTeam={draggedTeam}
        onClear={onClear}
        isLocked={lockedSlot === 'B'}
      />
      {showOdds && (
        <div className="px-2 py-1 border-t bg-gray-50 flex items-center gap-1">
          <span className="text-[10px] text-gray-500" title="% chance the TOP slot team wins this match">
            % top wins:
          </span>
          <input
            type="number" min={0} max={100} step={1} inputMode="numeric"
            value={oddsVal ?? ''}
            onChange={(e) => {
              let v = e.target.value;
              if (v !== '') {
                const n = Math.max(0, Math.min(100, Number(v)));
                v = String(n);
              }
              onOddsChange(matchId, v);
            }}
            placeholder={estimatedOdds !== null ? `~${estimatedOdds}` : '—'}
            disabled={!topPlaced || !botPlaced}
            title={
              estimatedOdds !== null && (oddsVal === undefined || oddsVal === '')
                ? `Estimated ${estimatedOdds}% from team strength — type to override`
                : undefined
            }
            className={`w-14 text-xs border rounded px-1 py-0.5 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              estimatedOdds !== null && (oddsVal === undefined || oddsVal === '')
                ? 'placeholder:text-blue-500 placeholder:italic'
                : ''
            }`}
          />
          <span className="text-[10px] text-gray-400 ml-auto">
            {slotLabel(m.A).split(' ')[0]}
          </span>
        </div>
      )}
    </div>
  );
}
