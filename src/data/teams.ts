import type { GroupLetter, Team, TeamCode } from '../types';

export const GROUPS: Record<GroupLetter, TeamCode[]> = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HTI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

const TEAM_NAMES: Record<TeamCode, string> = {
  MEX: 'Mexico', RSA: 'South Africa', KOR: 'South Korea', CZE: 'Czechia',
  CAN: 'Canada', BIH: 'Bosnia & Herzegovina', QAT: 'Qatar', SUI: 'Switzerland',
  BRA: 'Brazil', MAR: 'Morocco', HTI: 'Haiti', SCO: 'Scotland',
  USA: 'United States', PAR: 'Paraguay', AUS: 'Australia', TUR: 'Türkiye',
  GER: 'Germany', CUW: 'Curaçao', CIV: "Côte d'Ivoire", ECU: 'Ecuador',
  NED: 'Netherlands', JPN: 'Japan', SWE: 'Sweden', TUN: 'Tunisia',
  BEL: 'Belgium', EGY: 'Egypt', IRN: 'Iran', NZL: 'New Zealand',
  ESP: 'Spain', CPV: 'Cape Verde', KSA: 'Saudi Arabia', URU: 'Uruguay',
  FRA: 'France', SEN: 'Senegal', IRQ: 'Iraq', NOR: 'Norway',
  ARG: 'Argentina', ALG: 'Algeria', AUT: 'Austria', JOR: 'Jordan',
  POR: 'Portugal', COD: 'DR Congo', UZB: 'Uzbekistan', COL: 'Colombia',
  ENG: 'England', CRO: 'Croatia', GHA: 'Ghana', PAN: 'Panama',
};

const ISO2: Record<TeamCode, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HTI: 'ht', SCO: 'gb-sct',
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

export const TEAMS: Team[] = (() => {
  const out: Team[] = [];
  (Object.keys(GROUPS) as GroupLetter[]).forEach(g => {
    for (const code of GROUPS[g]) {
      out.push({ code, name: TEAM_NAMES[code], group: g, iso2: ISO2[code] });
    }
  });
  return out;
})();

export const TEAM_BY_CODE: Record<TeamCode, Team> = Object.fromEntries(
  TEAMS.map(t => [t.code, t]),
);

export function flagUrl(code: TeamCode): string {
  const iso = ISO2[code];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : '';
}

/**
 * Unicode flag emoji for a team. Used in the team-picker <select> (native
 * HTML <option> elements don't accept <img>, but Unicode flag glyphs work
 * everywhere modern: iOS, Android, macOS, recent Windows).
 *
 * Standard 2-letter ISO codes → pair of regional-indicator characters:
 *   "ar" → 🇦🇷 (regional A + regional R).
 *
 * Subdivision codes (gb-sct, gb-eng) → emoji "tag sequence" — supported on
 * iOS/macOS/Android/recent Windows. On older systems falls back to the
 * generic black-flag glyph 🏴.
 */
export function flagEmoji(code: TeamCode): string {
  const iso = ISO2[code];
  if (!iso) return '';
  if (iso.length === 2) {
    return iso
      .toUpperCase()
      .split('')
      .map(c => String.fromCodePoint(0x1F1E6 + (c.charCodeAt(0) - 65)))
      .join('');
  }
  // Tag sequences for the four UK home nations are well-defined in Emoji 11.
  // Currently we only need Scotland and England; if Wales/Northern Ireland
  // ever join, add them here the same way.
  if (iso === 'gb-sct') return '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}';
  if (iso === 'gb-eng') return '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}';
  return '\u{1F3F3}'; // white flag fallback for any future special case
}
