import { ROUND_ORDER } from '../data/bracket';
import { collectSubtreeByRound } from '../logic/paths';
import type { MatchId, TeamCode } from '../types';
import { MatchBox } from './MatchBox';

interface Props {
  rootId: MatchId;
  placements: Record<string, TeamCode>;
  odds: Record<MatchId, string>;
  draggedTeam: TeamCode | null;
  onClear: (matchId: MatchId, side: 'A' | 'B') => void;
  onOddsChange: (matchId: MatchId, value: string) => void;
}

export function OpponentFeederTree({
  rootId, placements, odds, draggedTeam, onClear, onOddsChange,
}: Props) {
  const byRound = collectSubtreeByRound(rootId);
  const cols = ROUND_ORDER.filter(r => byRound[r].length > 0);
  if (cols.length === 0) return null;
  for (const r of cols) byRound[r].sort();

  return (
    <div className="flex items-start gap-2 sm:gap-3 scrollable-x py-2 -mx-2 px-2">
      {cols.map((r, idx) => (
        <div key={r} className="contents">
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{r}</div>
            {byRound[r].map(mid => (
              <MatchBox
                key={mid}
                matchId={mid}
                placements={placements}
                odds={odds}
                draggedTeam={draggedTeam}
                onClear={onClear}
                onOddsChange={onOddsChange}
              />
            ))}
          </div>
          {idx < cols.length - 1 && (
            <div className="flex items-center self-stretch">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" className="text-gray-400 flex-shrink-0">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
