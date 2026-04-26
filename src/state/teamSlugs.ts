import type { TeamCode } from '../types';

/**
 * URL slug → team code map. Every team has a canonical English slug; many
 * also have native-language and common-spelling aliases so links can be
 * shared in the form people naturally write them
 * (e.g. /brazil, /brasil, and /bra all resolve to BRA).
 *
 * Slugs are lowercase, ASCII-only (no diacritics), hyphenated for multi-word
 * countries. The lookup function normalizes input the same way.
 */
const SLUGS: Record<string, TeamCode> = {
  // Group A
  mexico: 'MEX', mex: 'MEX',
  'south-africa': 'RSA', southafrica: 'RSA', rsa: 'RSA', sudafrica: 'RSA',
  'south-korea': 'KOR', southkorea: 'KOR', korea: 'KOR', kor: 'KOR', coreadelsur: 'KOR', coreedusud: 'KOR',
  czechia: 'CZE', czech: 'CZE', cze: 'CZE', chequia: 'CZE',

  // Group B
  canada: 'CAN', can: 'CAN', canada_: 'CAN',
  'bosnia-herzegovina': 'BIH', bosnia: 'BIH', bih: 'BIH',
  qatar: 'QAT', qat: 'QAT', catar: 'QAT',
  switzerland: 'SUI', sui: 'SUI', suiza: 'SUI', suisse: 'SUI', suica: 'SUI',

  // Group C
  brazil: 'BRA', brasil: 'BRA', bra: 'BRA',
  morocco: 'MAR', mar: 'MAR', marruecos: 'MAR', maroc: 'MAR', marrocos: 'MAR',
  haiti: 'HTI', hti: 'HTI',
  scotland: 'SCO', sco: 'SCO', escocia: 'SCO', ecosse: 'SCO',

  // Group D
  'united-states': 'USA', usa: 'USA', us: 'USA', estadosunidos: 'USA', etatsunis: 'USA',
  paraguay: 'PAR', par: 'PAR', paraguai: 'PAR',
  australia: 'AUS', aus: 'AUS',
  turkey: 'TUR', turkiye: 'TUR', tur: 'TUR', turquia: 'TUR', turquie: 'TUR',

  // Group E
  germany: 'GER', ger: 'GER', alemania: 'GER', allemagne: 'GER', alemanha: 'GER', deutschland: 'GER',
  curacao: 'CUW', cuw: 'CUW',
  'cote-divoire': 'CIV', civ: 'CIV', costademarfil: 'CIV', costadomarfim: 'CIV', ivorycoast: 'CIV',
  ecuador: 'ECU', ecu: 'ECU', equateur: 'ECU', equador: 'ECU',

  // Group F
  netherlands: 'NED', ned: 'NED', holland: 'NED', paisesbajos: 'NED', paysbas: 'NED', paisesbaixos: 'NED',
  japan: 'JPN', jpn: 'JPN', japon: 'JPN', japao: 'JPN',
  sweden: 'SWE', swe: 'SWE', suecia: 'SWE', suede: 'SWE',
  tunisia: 'TUN', tun: 'TUN', tunez: 'TUN', tunisie: 'TUN', tunisia_: 'TUN',

  // Group G
  belgium: 'BEL', bel: 'BEL', belgica: 'BEL', belgique: 'BEL',
  egypt: 'EGY', egy: 'EGY', egipto: 'EGY', egypte: 'EGY', egito: 'EGY',
  iran: 'IRN', irn: 'IRN', irao: 'IRN',
  'new-zealand': 'NZL', newzealand: 'NZL', nzl: 'NZL', nuevazelanda: 'NZL', nouvellezelande: 'NZL', novazelandia: 'NZL',

  // Group H
  spain: 'ESP', esp: 'ESP', espana: 'ESP', espagne: 'ESP', espanha: 'ESP',
  'cape-verde': 'CPV', capeverde: 'CPV', cpv: 'CPV', caboverde: 'CPV', capvert: 'CPV',
  'saudi-arabia': 'KSA', saudiarabia: 'KSA', ksa: 'KSA', arabiasaudita: 'KSA', arabiasaudi: 'KSA', arabiesaoudite: 'KSA',
  uruguay: 'URU', uru: 'URU', uruguai: 'URU',

  // Group I
  france: 'FRA', fra: 'FRA', francia: 'FRA', franca: 'FRA',
  senegal: 'SEN', sen: 'SEN',
  iraq: 'IRQ', irq: 'IRQ', irak: 'IRQ', iraque: 'IRQ',
  norway: 'NOR', nor: 'NOR', noruega: 'NOR', norvege: 'NOR',

  // Group J
  argentina: 'ARG', arg: 'ARG',
  algeria: 'ALG', alg: 'ALG', argelia: 'ALG', algerie: 'ALG', argelia_: 'ALG',
  austria: 'AUT', aut: 'AUT', autriche: 'AUT',
  jordan: 'JOR', jor: 'JOR', jordania: 'JOR', jordanie: 'JOR',

  // Group K
  portugal: 'POR', por: 'POR',
  'dr-congo': 'COD', drcongo: 'COD', cod: 'COD', rdcongo: 'COD',
  uzbekistan: 'UZB', uzb: 'UZB', ouzbekistan: 'UZB',
  colombia: 'COL', col: 'COL', colombie: 'COL', colombia_: 'COL',

  // Group L
  england: 'ENG', eng: 'ENG', inglaterra: 'ENG', angleterre: 'ENG',
  croatia: 'CRO', cro: 'CRO', croacia: 'CRO', croatie: 'CRO',
  ghana: 'GHA', gha: 'GHA', gana: 'GHA',
  panama: 'PAN', pan: 'PAN',
};

/**
 * Normalize an arbitrary slug input (strips slashes, lowercases, removes
 * diacritics) so callers can pass `/Argentina/` or `argentína` and get ARG.
 */
function normalize(input: string): string {
  return input
    .replace(/^\/+|\/+$/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .trim();
}

/**
 * Resolve a URL slug to a team code, or null if no match.
 * Used on app mount to pre-load a team from the URL path.
 */
export function teamFromSlug(slug: string): TeamCode | null {
  const key = normalize(slug);
  if (!key) return null;
  return SLUGS[key] ?? null;
}
