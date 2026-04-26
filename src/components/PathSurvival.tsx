import { ROUND_ORDER } from '../data/bracket';
import { useLang, useT } from '../i18n/context';
import type { Round, TeamCode } from '../types';

interface Props {
  round: Round;                              // current round card's round
  survivalChain: Record<Round, number>;     // P(win round) per round
  analyzedTeam: TeamCode;
}

function formatPct(p: number): string {
  if (p >= 0.1) return `${(p * 100).toFixed(0)}%`;
  if (p >= 0.01) return `${(p * 100).toFixed(1)}%`;
  if (p > 0) return `${(p * 100).toFixed(2)}%`;
  return '0%';
}

export function PathSurvival({ round, survivalChain, analyzedTeam }: Props) {
  const t = useT();
  const { teamName } = useLang();
  const startIdx = ROUND_ORDER.indexOf(round);

  // Label for "what advancing past round X gives the team". Final converts to
  // the special "Champion 🏆" string; every other round becomes "Reach <next>".
  const milestoneLabel = (r: Round): string => {
    if (r === 'Final') return t('survival.champion');
    const nextIdx = ROUND_ORDER.indexOf(r) + 1;
    const next = ROUND_ORDER[nextIdx];
    return t('survival.reach', { round: t(`round.${next}`) });
  };

  // Build cumulative survival from this round forward.
  const items: Array<{ label: string; prob: number }> = [];
  let cumulative = 1;
  for (let i = startIdx; i < ROUND_ORDER.length; i++) {
    const r = ROUND_ORDER[i];
    cumulative *= survivalChain[r];
    items.push({ label: milestoneLabel(r), prob: cumulative });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-3 bg-gray-50 rounded border border-gray-200 p-2.5">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-2 leading-tight">
        {t('survival.from_here', { team: teamName(analyzedTeam) })}
      </div>
      <ul className="space-y-1.5">
        {items.map(({ label, prob }) => (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span className="w-[88px] text-gray-700 truncate">{label}</span>
            <div className="flex-1 bg-gray-200 rounded-sm h-1.5 overflow-hidden min-w-0">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${Math.max(prob * 100, prob > 0 ? 1 : 0)}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono font-semibold text-gray-800 tabular-nums">
              {formatPct(prob)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
