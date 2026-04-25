import { TEAM_BY_CODE } from '../data/teams';
import type { Round, TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface Props {
  round: Round;
  dist: Array<[TeamCode, number]>;
  fallback?: string | null;
}

export function ResolvedOpponent({ round, dist, fallback }: Props) {
  return (
    <div className="border-l-2 border-blue-200 pl-3 min-w-[200px]">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
        {round} opponent
      </div>
      {dist.length === 0 ? (
        <div className="text-xs text-gray-500 italic">{fallback || 'TBD — fill in opponent feeder'}</div>
      ) : dist.length === 1 && Math.abs(dist[0][1] - 1) < 1e-9 ? (
        <div className="flex items-center gap-2 text-sm">
          <FlagImg code={dist[0][0]} size="lg" />
          <span className="font-medium">{TEAM_BY_CODE[dist[0][0]].name}</span>
        </div>
      ) : (
        <ul className="space-y-1">
          {dist.map(([code, p]) => (
            <li key={code} className="flex items-center gap-2 text-xs">
              <FlagImg code={code} />
              <span className="flex-1">{TEAM_BY_CODE[code].name}</span>
              <span className="font-mono text-gray-700 font-semibold">
                {(p * 100).toFixed(p < 0.1 ? 1 : 0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
