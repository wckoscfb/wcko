import { TEAM_BY_CODE } from '../data/teams';
import type { MatchId, SlotSide, TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface Props {
  matchId: MatchId;
  analyzedTeam: TeamCode;
  analyzedSide: SlotSide;
  opponentDist: Array<[TeamCode, number]>;
}

export function RoundMatchBox({ matchId, analyzedTeam, analyzedSide, opponentDist }: Props) {
  const renderSlot = (isAnalyzed: boolean) => {
    let content: JSX.Element;
    if (isAnalyzed) {
      content = (
        <>
          <FlagImg code={analyzedTeam} />
          <span className="flex-1 truncate font-medium">{TEAM_BY_CODE[analyzedTeam].name}</span>
          <span className="text-[10px] text-gray-400">(you)</span>
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
      content = (
        <>
          <FlagImg code={topCode} />
          <span className="flex-1 truncate text-gray-700">{TEAM_BY_CODE[topCode].name}</span>
          <span className="text-[10px] text-gray-500">{(topProb * 100).toFixed(0)}%</span>
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
    </div>
  );
}
