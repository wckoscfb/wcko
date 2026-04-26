import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TeamCode } from '../types';
import { teamName as resolveTeamName } from './teams';
import { STRINGS, type StringKey } from './translations';
import { LANGS, type Lang } from './types';

const LS_KEY = 'wcko.lang';

function detectInitial(): Lang {
  if (typeof window === 'undefined') return 'en';
  // 1. localStorage takes precedence (user explicitly chose).
  try {
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved && LANGS.some(l => l.code === saved)) return saved as Lang;
  } catch { /* private mode etc. */ }
  // 2. Match the browser's primary language to a supported one.
  const langs = window.navigator.languages ?? [window.navigator.language ?? 'en'];
  for (const l of langs) {
    const short = (l ?? '').slice(0, 2).toLowerCase();
    if (LANGS.some(x => x.code === short)) return short as Lang;
  }
  return 'en';
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key. Replaces `{name}` with values from `vars`. */
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** Localized country/team name. */
  teamName: (code: TeamCode) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitial());

  // Persist + reflect on <html lang> for accessibility / search engines.
  useEffect(() => {
    try { window.localStorage.setItem(LS_KEY, lang); } catch { /* noop */ }
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback<LangCtx['t']>((key, vars) => {
    const entry = STRINGS[key];
    let raw = entry?.[lang] ?? entry?.en ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        raw = raw.replaceAll(`{${k}}`, String(v));
      }
    }
    return raw;
  }, [lang]);

  const teamName = useCallback((code: TeamCode) => resolveTeamName(code, lang), [lang]);

  const value = useMemo<LangCtx>(() => ({ lang, setLang, t, teamName }), [lang, setLang, t, teamName]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang must be used inside <LangProvider>');
  return v;
}

/** Shortcut for `useLang().t` — the most-common access pattern in components. */
export function useT() {
  return useLang().t;
}
