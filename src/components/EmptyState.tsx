import type { MouseEvent } from 'react';
import { CANONICAL_SLUG } from '../data/teamCanonicalSlugs';
import { TEAMS } from '../data/teams';
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
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">
          {t('empty.quick_start')}
        </h2>
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
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          {t('empty.how_it_works')}
        </h2>
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

      {/* Browse-all-teams section: every team gets a real <a> link to its
          country page. Doubles as (a) a discoverability fallback for users
          who don't see their team in the quick-start row, and (b) crawler
          reachability — search engines now have a path from / to every
          /<country> page in one click, which helps the per-team pages get
          indexed. */}
      <section className="bg-white border rounded-lg shadow-sm p-4 sm:p-5 mt-5">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">
          {t('empty.browse_all')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1">
          {[...TEAMS].sort((a, b) => teamName(a.code).localeCompare(teamName(b.code))).map(team => (
            <a
              key={team.code}
              href={`/${CANONICAL_SLUG[team.code]}`}
              onClick={(e) => {
                // Inside the SPA, prefer client-side state update over a full
                // page reload — feels instant. Hold ⌘/Ctrl to force open in a
                // new tab (browser default behaviour preserved).
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                onTeamPick(team.code);
              }}
              className="flex items-center gap-1.5 px-1.5 py-1 text-xs rounded hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              <FlagImg code={team.code} />
              <span className="truncate text-gray-700">{teamName(team.code)}</span>
            </a>
          ))}
        </div>
      </section>

      {/* About section — keyword-rich content for SEO. Plain text, no fancy
          styling, intentionally low visual weight so it doesn't distract from
          the action above. Crawlers love this; humans skim past it. */}
      <section className="mt-6 px-2 max-w-prose mx-auto">
        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          {t('empty.about_heading')}
        </h2>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          {t('empty.about_body')}
        </p>
      </section>

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
