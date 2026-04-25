import { TEAM_BY_CODE } from '../data/teams';
import type { TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface EmptyStateProps {
  onTeamPick: (code: TeamCode) => void;
}

// Tournament favourites — the teams users are most likely to want to try first.
// Mix of historical contenders + 2026 specific (e.g. Argentina as defending champ).
const QUICK_START_TEAMS: TeamCode[] = ['ARG', 'FRA', 'BRA', 'ENG', 'ESP', 'POR'];

export function EmptyState({ onTeamPick }: EmptyStateProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-8">
        <img
          src="/icon-192.png"
          alt="WCKO"
          width="80"
          height="80"
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl shadow-sm"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          Visualize every team's path to Glory
        </h1>
      </div>

      {/* Quick-start: tap a team to jump straight in */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-5 mb-5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">
          Quick start with a favourite
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_START_TEAMS.map(code => {
            const team = TEAM_BY_CODE[code];
            return (
              <button
                key={code}
                onClick={() => onTeamPick(code)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent hover:border-blue-200 hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                <FlagImg code={code} size="lg" />
                <span className="text-xs font-medium text-gray-700">{team.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-500 text-center mt-3">
          Or pick any of the 48 teams from the menu at the top
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          How it works
        </div>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <span className="text-sm text-gray-700 leading-snug">
              Pick a team and how they finish their group — <strong>1°</strong>, <strong>2°</strong> or <strong>3°</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <span className="text-sm text-gray-700 leading-snug">
              Drag opponents into the bracket and (optionally) set match odds — or let WCKO estimate them from team strength.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <span className="text-sm text-gray-700 leading-snug">
              See who your team might face at every round, all the way to the Final.
            </span>
          </li>
        </ol>
      </div>

      {/* Tiny prompt below — encourages scrolling/exploration */}
      <p className="text-[11px] text-gray-400 text-center mt-6">
        Save scenarios in your browser. Share a link with friends. Refresh as the tournament unfolds.
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="text-center text-[10px] text-gray-400 py-4 px-4">
      WCKO · scenarios saved to your browser · not affiliated with or endorsed by FIFA
    </footer>
  );
}
