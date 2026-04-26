// Supported UI languages. 'en' is the source-of-truth fallback.
export type Lang = 'en' | 'es' | 'fr' | 'pt';

export const LANGS: ReadonlyArray<{ code: Lang; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: 'gb' },
  { code: 'es', label: 'Español', flag: 'es' },
  { code: 'fr', label: 'Français', flag: 'fr' },
  { code: 'pt', label: 'Português', flag: 'pt' },
] as const;
