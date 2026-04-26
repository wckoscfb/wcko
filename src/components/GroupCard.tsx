import { GROUPS, TEAM_BY_CODE } from '../data/teams';
import { useLang, useT } from '../i18n/context';
import type { TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface Props {
  analyzedTeam: TeamCode;
}

export function GroupCard({ analyzedTeam }: Props) {
  const t = useT();
  const { teamName } = useLang();
  const team = TEAM_BY_CODE[analyzedTeam];
  if (!team) return null;
  return (
    <section className="bg-white rounded-lg shadow-sm border p-3">
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
        {t('group.label', { letter: team.group })}
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {GROUPS[team.group].map(c => (
          <div
            key={c}
            className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
              c === analyzedTeam ? 'bg-blue-100 font-semibold' : 'bg-gray-50'
            }`}
          >
            <FlagImg code={c} />
            <span>{teamName(c)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
