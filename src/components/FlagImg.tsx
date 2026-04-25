import { TEAM_BY_CODE, flagUrl } from '../data/teams';
import type { TeamCode } from '../types';

interface Props {
  code: TeamCode | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FlagImg({ code, size = 'sm', className = '' }: Props) {
  if (!code) return null;
  const team = TEAM_BY_CODE[code];
  if (!team) return null;
  const sizeClass = size === 'lg' ? 'flag-img-lg' : size === 'md' ? 'flag-img-md' : 'flag-img';
  const cls = sizeClass + ' ' + className;
  return (
    <img
      src={flagUrl(code)}
      alt={team.name}
      title={team.name}
      className={cls}
      draggable={false}
      loading="lazy"
    />
  );
}
