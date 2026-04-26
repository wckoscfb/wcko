import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MATCHES, slotLabel } from '../data/bracket';
import { bradleyTerryTopWins } from '../data/odds';
import { useLang, useT } from '../i18n/context';
import { eligibleForMatchSide } from '../logic/eligibility';
import { matchIsOneVsThird } from '../logic/probability';
import type { DropTargetData, MatchId, SlotSide, TeamCode } from '../types';
import { FlagImg } from './FlagImg';
import { LockBadge } from './LockBadge';

interface MatchBoxProps {
  matchId: MatchId;
  placements: Record<string, TeamCode>;
  odds: Record<MatchId, string>;
  useEstimatedOdds?: boolean;
  draggedTeam: TeamCode | null;
  onClear: (matchId: MatchId, side: SlotSide) => void;
  onOddsChange: (matchId: MatchId, value: string) => void;
  showOdds?: boolean;
  lockedSlot?: SlotSide | null;
  /**
   * Optional: when this side is empty and an estimate exists for it, render the
   * estimated top opponent inline (italic, with %). Slot stays droppable so the
   * user can override by dragging a specific team in.
   */
  slotEstimate?: { side: SlotSide; code: TeamCode; prob: number };
  /**
   * Optional: the unique key (`${matchId}.${side}`) of the single empty slot
   * that should render the "you can drop a team here" hint. Only one slot in
   * the entire UI gets the hint, to avoid visual repetition.
   */
  hintSlotKey?: string | null;
}

interface SlotProps {
  matchId: MatchId;
  side: SlotSide;
  placements: Record<string, TeamCode>;
  draggedTeam: TeamCode | null;
  onClear: (matchId: MatchId, side: SlotSide) => void;
  isLocked: boolean;
  estimate?: { code: TeamCode; prob: number };
  showHint?: boolean;
}

function Slot({ matchId, side, placements, draggedTeam, onClear, isLocked, estimate, showHint }: SlotProps) {
  const t = useT();
  const { teamName } = useLang();
  const m = MATCHES[matchId];
  const slot = m[side];
  const placed = placements[`${matchId}.${side}`];
  const eligible = eligibleForMatchSide(matchId, side);
  const canDrop = !!draggedTeam && eligible.has(draggedTeam) && !isLocked;
  const isThirdsFaded = slot.kind === 'thirds' && !placed;

  // Drop target
  const dropId = `slot:${matchId}:${side}`;
  const dropData: DropTargetData = { kind: 'slot', matchId, side };
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: dropData,
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
            title={isLocked ? teamName(placed) : t('match.drag_to_next', { team: teamName(placed) })}
          >
            <FlagImg code={placed} />
            <span className="flex-1 truncate">{teamName(placed)}</span>
          </div>
          {isLocked ? (
            <LockBadge />
          ) : (
            <button
              onClick={() => onClear(matchId, side)}
              onContextMenu={(e) => { e.preventDefault(); onClear(matchId, side); }}
              className="text-gray-400 hover:text-red-600 text-xs px-1 py-1"
              title={t('match.clear')}
              aria-label={t('match.clear')}
            >✕</button>
          )}
        </>
      ) : estimate ? (
        // Show the estimated top opponent inline. Italic + lighter background
        // signals "this is an estimate, not a hard placement". Slot stays
        // droppable so the user can override by dragging a specific team in.
        <div
          className="flex items-center gap-2 flex-1 min-w-0 py-1 italic"
          title={t('match.estimate_top_title')}
        >
          <FlagImg code={estimate.code} />
          <span className="flex-1 truncate text-gray-700">{teamName(estimate.code)}</span>
          <span className="text-sm font-bold text-blue-700 tabular-nums leading-none not-italic">
            {(estimate.prob * 100).toFixed(0)}%
          </span>
        </div>
      ) : (
        <span
          className="flex-1 truncate py-1 text-gray-500 italic"
          title={t('match.empty_slot_title', { label: slotLabel(slot) })}
        >
          {slotLabel(slot)}{slot.kind === 'thirds' ? ` ${t('match.thirds_any')}` : ''}
          {showHint && (
            <span className="ml-1.5 text-gray-400 text-[10px] not-italic font-normal whitespace-nowrap">
              {t('match.drop_hint')}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export function MatchBox({
  matchId,
  placements,
  odds,
  useEstimatedOdds = true,
  draggedTeam,
  onClear,
  onOddsChange,
  showOdds = true,
  lockedSlot = null,
  slotEstimate,
  hintSlotKey,
}: MatchBoxProps) {
  const t = useT();
  const m = MATCHES[matchId];
  const topPlaced = placements[`${matchId}.A`];
  const botPlaced = placements[`${matchId}.B`];
  const oddsVal = odds[matchId];
  const isOneVsThird = matchIsOneVsThird(matchId);

  // Bradley-Terry estimate shown as placeholder text — but only when the
  // global auto-estimate toggle is ON. In manual mode, no placeholder shows
  // and unset odds default to 50/50 in the math.
  const estimatedOdds = useEstimatedOdds && topPlaced && botPlaced
    ? bradleyTerryTopWins(topPlaced, botPlaced)
    : null;

  return (
    <div className="border border-gray-300 bg-white rounded shadow-sm w-44 sm:w-48 flex-shrink-0">
      <div className="text-[10px] text-gray-500 px-2 py-0.5 border-b bg-gray-50 flex justify-between">
        <span className="font-mono font-semibold">{matchId}</span>
        {isOneVsThird && (
          <span className="text-gray-400" title={t('match.auto_one_title')}>
            {t('match.auto_one')}
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
        estimate={slotEstimate?.side === 'A' ? { code: slotEstimate.code, prob: slotEstimate.prob } : undefined}
        showHint={hintSlotKey === `${matchId}.A`}
      />
      <Slot
        matchId={matchId}
        side="B"
        placements={placements}
        draggedTeam={draggedTeam}
        onClear={onClear}
        isLocked={lockedSlot === 'B'}
        estimate={slotEstimate?.side === 'B' ? { code: slotEstimate.code, prob: slotEstimate.prob } : undefined}
        showHint={hintSlotKey === `${matchId}.B`}
      />
      {showOdds && (
        <div className="px-2 py-1 border-t bg-gray-50 flex items-center gap-1">
          <span className="text-[10px] text-gray-500" title={t('match.top_wins_title')}>
            {t('match.top_wins')}
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
                ? t('match.estimated_odds_title', { pct: estimatedOdds })
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
