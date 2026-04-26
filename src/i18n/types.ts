// Supported UI languages. 'en' is the source-of-truth fallback.
export type Lang = 'en' | 'es' | 'fr' | 'pt';

// `emoji` uses Unicode regional-indicator flag glyphs — these render natively
// inside <option> elements on every modern platform (iOS, Android, macOS,
// recent Windows). On very old Windows there's no glyph; the OS falls back
// to letter pairs ("GB", "ES", ...) which is still readable.
export const LANGS: ReadonlyArray<{ code: Lang; label: string; emoji: string }> = [
  { code: 'en', label: 'English',    emoji: '🇬🇧' },
  { code: 'es', label: 'Español',    emoji: '🇪🇸' },
  { code: 'fr', label: 'Français',   emoji: '🇫🇷' },
  { code: 'pt', label: 'Português',  emoji: '🇵🇹' },
] as const;
