import { useMemo } from 'react';
import { MATCHES, ROUND_LABEL, TREE, slotLabel } from '../data/bracket';
import { computeWinnerDistribution, determineLeafLevel, sortedDist } from '../logic/probability';
import type { Match, MatchId, Round, SlotSide, TeamCode } from '../types';
import { MatchBox } from './MatchBox';
import { OpponentFeederTree } from './OpponentFeederTree';
import { ResolvedOpponent } from './ResolvedOpponent';
import { RoundMatchBox } from './RoundMatchBox';

interface Props {
  round: Round;
  roundMatchId: MatchId;
  analyzedTeam: TeamCode;
  analyzedSide: SlotSide;
  opponentFeederRoot: MatchId | null;
  placements: Record<string, TeamCode>;
  odds: Record<MatchId, string>;
  onClear: (matchId: MatchId, side: SlotSide) => void;
  onOddsChange: (matchId: MatchId, value: string) => void;
  draggedTeam: TeamCode | null;
}

function r32Fallback(
  round: Round, m: Match, analyzedSide: SlotSide,
  placements: Record<string, TeamCode>, roundMatchId: MatchId,
): string | null {
  if (round !== 'R32') return null;
  const oppSide: SlotSide = analyzedSide === 'A' ? 'B' : 'A';
  const slot = m[oppSide];
  if (placements[`${roundMatchId}.${oppSide}`]) return null;
  if (slot.kind === 'thirds') {
    return `Any 3° team from {${slot.groups.join(', ')}} — drop a flag to specify`;
  }
  return `Drop a ${slotLabel(slot)} team into the slot`;
}

export function RoundCard({
  round, roundMatchId, analyzedTeam, analyzedSide, opponentFeederRoot,
  placements, odds, onClear, onOddsChange, draggedTeam,
}: Props) {
  const m = MATCHES[roundMatchId];

  const opponentDist = useMemo(() => {
    if (round === 'R32') {
      const oppSide: SlotSide = analyzedSide === 'A' ? 'B' : 'A';
      const placed = placements[`${roundMatchId}.${oppSide}`];
      const dist = new Map<TeamCode, number>();
      if (placed) dist.set(placed, 1);
      return dist;
    } else if (opponentFeederRoot) {
      return computeWinnerDistribution(opponentFeederRoot, placements, odds);
    }
    return new Map<TeamCode, number>();
  }, [round, roundMatchId, analyzedSide, opponentFeederRoot, placements, odds]);

  // Which round level is the opponent calculation actually using?
  // Drives the "With this R32:" / "With this R16:" label in ResolvedOpponent.
  const leafLevel = useMemo(() => {
    if (round === 'R32' || !opponentFeederRoot) return null;
    return determineLeafLevel(opponentFeederRoot, placements);
  }, [round, opponentFeederRoot, placements]);

  const sortedOpp = useMemo(() => sortedDist(opponentDist), [opponentDist]);

  const heading = useMemo(() => {
    if (round === 'R32') return `${roundMatchId} (${slotLabel(m.A)} vs ${slotLabel(m.B)})`;
    const ch = TREE[roundMatchId];
    return `${roundMatchId} (winner ${ch[0]} vs winner ${ch[1]})`;
  }, [round, roundMatchId, m]);

  return (
    <section className="bg-white rounded-lg shadow-sm border">
      <div className="px-3 sm:px-4 py-2 border-b flex items-center gap-2 sm:gap-3 flex-wrap">
        <h3 className="font-bold text-sm">{ROUND_LABEL[round]}</h3>
        <span className="text-xs text-gray-500 font-mono hidden sm:inline">{heading}</span>
      </div>

      <div className="px-3 sm:px-4 py-3">
        {round === 'R32' ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Your match</div>
              <MatchBox
                matchId={roundMatchId}
                placements={placements}
                odds={odds}
                draggedTeam={draggedTeam}
                onClear={onClear}
                onOddsChange={onOddsChange}
                showOdds={false}
                lockedSlot={analyzedSide}
              />
            </div>
            <ResolvedOpponent
              round={round}
              dist={sortedOpp}
              fallback={r32Fallback(round, m, analyzedSide, placements, roundMatchId)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Your match</div>
              <RoundMatchBox
                matchId={roundMatchId}
                analyzedTeam={analyzedTeam}
                analyzedSide={analyzedSide}
                opponentDist={sortedOpp}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
                Opponent feeder — fill in flags & odds to compute who you might play
              </div>
              {opponentFeederRoot && (
                <OpponentFeederTree
                  rootId={opponentFeederRoot}
                  placements={placements}
                  odds={odds}
                  draggedTeam={draggedTeam}
                  onClear={onClear}
                  onOddsChange={onOddsChange}
                />
              )}
            </div>
            <ResolvedOpponent round={round} dist={sortedOpp} fallback={null} leafLevel={leafLevel} />
          </div>
        )}
      </div>
    </section>
  );
}
