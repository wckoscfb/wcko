import type { MouseEvent } from 'react';
import { useLang, useT } from '../i18n/context';
import type { TeamCode } from '../types';
import { FlagImg } from './FlagImg';

interface EmptyStateProps {
  onTeamPick: (code: TeamCode) => void;
}

// Tournament favourites — the teams users are most likely to want to try first.
// Mix of historical contenders + 2026 specific (e.g. Argentina as defending champ).
const QUICK_START_TEAMS: TeamCode[] = ['ARG', 'FRA', 'BRA', 'ENG', 'ESP', 'POR', 'GER', 'NED'];

export function EmptyState({ onTeamPick }: EmptyStateProps) {
  const t = useT();
  const { teamName } = useLang();

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
          {t('empty.tagline')}
        </h1>
      </div>

      {/* Quick-start: tap a team to jump straight in */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-5 mb-5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">
          {t('empty.quick_start')}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_START_TEAMS.map(code => (
            <button
              key={code}
              onClick={() => onTeamPick(code)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent hover:border-blue-200 hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              <FlagImg code={code} size="lg" />
              <span className="text-xs font-medium text-gray-700">{teamName(code)}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 text-center mt-3">
          {t('empty.or_pick')}
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          {t('empty.how_it_works')}
        </div>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <span className="text-sm text-gray-700 leading-snug">{t('empty.step1')}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <span className="text-sm text-gray-700 leading-snug">{t('empty.step2')}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <span className="text-sm text-gray-700 leading-snug">{t('empty.step3')}</span>
          </li>
        </ol>
      </div>

      {/* Tiny prompt below — encourages scrolling/exploration */}
      <p className="text-[11px] text-gray-400 text-center mt-6">
        {t('empty.preserved')}
      </p>
    </div>
  );
}

export function Footer() {
  const t = useT();

  // Light obfuscation — assemble the address at click time so static HTML
  // scrapers don't pick it up as a literal string. Real users still get a
  // normal mailto behaviour.
  const handleContact = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const addr = ['admin', 'wcko.io'].join('@');
    const subject = encodeURIComponent(t('footer.email_subject'));
    window.location.href = `mailto:${addr}?subject=${subject}`;
  };

  return (
    <footer className="text-center text-[10px] text-gray-400 py-4 px-4">
      {t('footer.tagline')}
      <span aria-hidden="true"> · </span>
      <a
        href="#contact"
        onClick={handleContact}
        className="underline hover:text-gray-600"
        title={t('footer.feedback_title')}
      >
        {t('footer.feedback')}
      </a>
    </footer>
  );
}
