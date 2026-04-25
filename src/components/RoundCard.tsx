import { useMemo } from 'react';
import { MATCHES, ROUND_LABEL, TREE, slotLabel } from '../data/bracket';
import { positionProbabilities, thirdsCandidateDistribution } from '../data/odds';
import { computeWinnerDistribution, determineLeafLevel, sortedDist } from '../logic/probability';
import type { Match, MatchId, Round, SlotSide, TeamCode } from '../types';
import { MatchBox } from './MatchBox';
import { OpponentFeederTree } from './OpponentFeederTree';
import { PathSurvival } from './PathSurvival';
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
  useEstimatedOdds: boolean;
  survivalChain: Record<Round, number> | null;
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
  placements, odds, useEstimatedOdds, survivalChain, onClear, onOddsChange, draggedTeam,
}: Props) {
  const m = MATCHES[roundMatchId];

  const opponentDist = useMemo(() => {
    if (round === 'R32') {
      const oppSide: SlotSide = analyzedSide === 'A' ? 'B' : 'A';
      const placed = placements[`${roundMatchId}.${oppSide}`];
      if (placed) return new Map<TeamCode, number>([[placed, 1]]);
      // Empty opponent slot — only auto-estimate when toggle is ON.
      if (!useEstimatedOdds) return new Map<TeamCode, number>();
      const slot = m[oppSide];
      if (slot.kind === 'group') {
        return positionProbabilities(slot.group, slot.pos as 1 | 2);
      }
      if (slot.kind === 'thirds') {
        return thirdsCandidateDistribution(slot.groups);
      }
      return new Map<TeamCode, number>();
    } else if (opponentFeederRoot) {
      return computeWinnerDistribution(opponentFeederRoot, placements, odds, useEstimatedOdds);
    }
    return new Map<TeamCode, number>();
  }, [round, roundMatchId, analyzedSide, opponentFeederRoot, placements, odds, useEstimatedOdds, m]);

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
            <div className="lg:w-48 flex-shrink-0">
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Your match</div>
              <MatchBox
                matchId={roundMatchId}
                placements={placements}
                odds={odds}
                useEstimatedOdds={useEstimatedOdds}
                draggedTeam={draggedTeam}
                onClear={onClear}
                onOddsChange={onOddsChange}
                showOdds={false}
                lockedSlot={analyzedSide}
                slotEstimate={
                  // Show inline estimate of top opponent in the empty slot
                  // (same data as the right panel; visual symmetry with R16+ rounds).
                  sortedOpp.length > 0 && useEstimatedOdds
                    ? {
                        side: analyzedSide === 'A' ? 'B' : 'A',
                        code: sortedOpp[0][0],
                        prob: sortedOpp[0][1],
                      }
                    : undefined
                }
              />
              {survivalChain && (
                <PathSurvival round={round} survivalChain={survivalChain} analyzedTeam={analyzedTeam} />
              )}
            </div>
            {/* Middle column on desktop — pushes the resolved-opponent panel
                to the right edge so layout matches the higher rounds. Hidden
                on mobile to save vertical space. */}
            <div className="hidden lg:block min-w-0 flex-1 pt-4">
              <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                Drag a specific team into the opponent slot to lock in a
                match-up. Otherwise the panel shows the most likely opponents
                based on group-stage simulation.
              </p>
            </div>
            <ResolvedOpponent
              round={round}
              dist={sortedOpp}
              fallback={r32Fallback(round, m, analyzedSide, placements, roundMatchId)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="lg:w-48 flex-shrink-0">
              <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">Your match</div>
              <RoundMatchBox
                matchId={roundMatchId}
                analyzedTeam={analyzedTeam}
                analyzedSide={analyzedSide}
                opponentDist={sortedOpp}
                round={round}
              />
              {survivalChain && (
                <PathSurvival round={round} survivalChain={survivalChain} analyzedTeam={analyzedTeam} />
              )}
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
                  useEstimatedOdds={useEstimatedOdds}
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
