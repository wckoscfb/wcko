import { useLang } from '../i18n/context';
import { LANGS, type Lang } from '../i18n/types';

/**
 * Compact language switcher — a styled `<select>` so it works on every
 * platform (mobile included) without custom dropdown plumbing. Lives in
 * the top bar next to Save/Load.
 */
export function LangSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <label className="flex items-center" title={t('lang.label')}>
      <span className="sr-only">{t('lang.label')}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="border rounded px-2 py-1 text-sm bg-white cursor-pointer"
        aria-label={t('lang.label')}
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>
            {l.emoji} {l.code.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
