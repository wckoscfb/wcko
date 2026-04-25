import { ROUND_LABEL } from '../data/bracket';
import { TEAM_BY_CODE } from '../data/teams';
import type { MatchId, Round, SlotSide, TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface Props {
  matchId: MatchId;
  analyzedTeam: TeamCode;
  analyzedSide: SlotSide;
  opponentDist: Array<[TeamCode, number]>;
  round: Round;
}

export function RoundMatchBox({ matchId, analyzedTeam, analyzedSide, opponentDist, round }: Props) {
  // True when the opponent is non-deterministic (multiple candidates) — that's
  // when the % needs explanation, since users could otherwise misread it as
  // "they win" or "we play them for sure".
  const showsPercent =
    opponentDist.length > 0 &&
    !(opponentDist.length === 1 && Math.abs(opponentDist[0][1] - 1) < 1e-9);

  const renderSlot = (isAnalyzed: boolean) => {
    let content: JSX.Element;
    if (isAnalyzed) {
      content = (
        <>
          <FlagImg code={analyzedTeam} />
          <span className="flex-1 truncate font-medium">{TEAM_BY_CODE[analyzedTeam].name}</span>
          <span
            className="text-blue-600 flex-shrink-0"
            title="Your analyzed team — locked across every round"
            aria-label="Your team — locked"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
          </span>
        </>
      );
    } else if (opponentDist.length === 0) {
      content = <span className="text-gray-400 italic flex-1">opponent — TBD</span>;
    } else if (opponentDist.length === 1 && Math.abs(opponentDist[0][1] - 1) < 1e-9) {
      const [code] = opponentDist[0];
      content = (
        <>
          <FlagImg code={code} />
          <span className="flex-1 truncate">{TEAM_BY_CODE[code].name}</span>
        </>
      );
    } else {
      const [topCode, topProb] = opponentDist[0];
      const pct = (topProb * 100).toFixed(0);
      const teamName = TEAM_BY_CODE[topCode].name;
      const tooltip = `${teamName} has a ${pct}% chance of being your ${ROUND_LABEL[round]} opponent. Other candidates and their probabilities are listed in the panel on the right.`;
      content = (
        <>
          <FlagImg code={topCode} />
          <span className="flex-1 truncate text-gray-700">{teamName}</span>
          <span
            className="text-sm font-bold text-blue-700 tabular-nums leading-none"
            title={tooltip}
            aria-label={tooltip}
          >
            {pct}%
          </span>
        </>
      );
    }
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 min-h-[28px] text-xs ${
        isAnalyzed ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200 bg-white'
      }`}>
        {content}
      </div>
    );
  };

  return (
    <div className="border border-gray-300 rounded shadow-sm w-44 sm:w-48 flex-shrink-0 bg-gray-50">
      <div className="text-[10px] text-gray-500 px-2 py-0.5 border-b font-mono font-semibold">{matchId}</div>
      {analyzedSide === 'A' ? (
        <>{renderSlot(true)}{renderSlot(false)}</>
      ) : (
        <>{renderSlot(false)}{renderSlot(true)}</>
      )}
      {/* Always-visible footer caption explaining the percentage. Only shown
          when the opponent is non-deterministic (i.e. % is being displayed),
          so it doesn't add visual noise when the opponent is a single team. */}
      {showsPercent && (
        <div className="text-[9px] text-gray-500 italic px-2 py-1 border-t bg-white leading-tight">
          % = chance to face you at this round
        </div>
      )}
    </div>
  );
}
