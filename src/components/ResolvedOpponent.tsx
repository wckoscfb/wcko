import { TEAM_BY_CODE } from '../data/teams';
import type { Round, TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface Props {
  round: Round;
  dist: Array<[TeamCode, number]>;
  fallback?: string | null;
  /**
   * Which round level the calculation is using as the source of truth.
   * Drives the small "With this Rxx:" label above the list.
   */
  leafLevel?: Round | null;
}

// Show top N candidates individually; collapse the rest into one "+ N other (Y%)" row.
// Keeps the panel readable when 3° estimation produces many low-probability candidates.
const TOP_N = 6;
const MIN_DISPLAY_PCT = 0.5; // hide individual rows below 0.5%

export function ResolvedOpponent({ round, dist, fallback, leafLevel }: Props) {
  // Filter out near-zero entries and partition into "shown" vs "collapsed"
  const filtered = dist.filter(([, p]) => p * 100 >= MIN_DISPLAY_PCT);
  const shown = filtered.slice(0, TOP_N);
  const collapsed = filtered.slice(TOP_N);
  const collapsedSum = collapsed.reduce((s, [, p]) => s + p, 0);
  const collapsedCount = collapsed.length;
  // Also count the under-threshold tail
  const subThreshold = dist.length - filtered.length;
  const subThresholdSum = dist.filter(([, p]) => p * 100 < MIN_DISPLAY_PCT).reduce((s, [, p]) => s + p, 0);
  const otherCount = collapsedCount + subThreshold;
  const otherSum = collapsedSum + subThresholdSum;

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
        <>
          {leafLevel && (
            <div className="text-[10px] text-blue-700 font-medium italic mb-1">
              With this {leafLevel}:
            </div>
          )}
          <ul className="space-y-1">
            {shown.map(([code, p]) => (
              <li key={code} className="flex items-center gap-2 text-xs">
                <FlagImg code={code} />
                <span className="flex-1">{TEAM_BY_CODE[code].name}</span>
                <span className="font-mono text-gray-700 font-semibold">
                  {(p * 100).toFixed(p < 0.1 ? 1 : 0)}%
                </span>
              </li>
            ))}
            {otherCount > 0 && (
              <li
                className="flex items-center gap-2 text-xs text-gray-500 italic pt-1 border-t border-dashed border-gray-200"
                title={`Sum of all teams below ${TOP_N > 0 ? 'top ' + TOP_N : 'threshold'}`}
              >
                <span className="w-[22px] text-center">…</span>
                <span className="flex-1">+{otherCount} other team{otherCount > 1 ? 's' : ''}</span>
                <span className="font-mono">{(otherSum * 100).toFixed(otherSum < 0.1 ? 1 : 0)}%</span>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
