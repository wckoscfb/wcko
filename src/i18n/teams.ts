import type { TeamCode } from '../types';
import type { Lang } from './types';

/**
 * Localized country names for the 48 World Cup teams. Keep the keys exactly
 * the same as in `src/data/teams.ts`. Where a country reads identically in
 * a target language (or an English form is widely accepted), the entry is
 * the same in both — that's intentional.
 */
const TEAM_NAMES_I18N: Record<TeamCode, Record<Lang, string>> = {
  // Group A
  MEX: { en: 'Mexico',         es: 'México',          fr: 'Mexique',         pt: 'México' },
  RSA: { en: 'South Africa',   es: 'Sudáfrica',       fr: 'Afrique du Sud',  pt: 'África do Sul' },
  KOR: { en: 'South Korea',    es: 'Corea del Sur',   fr: 'Corée du Sud',    pt: 'Coreia do Sul' },
  CZE: { en: 'Czechia',        es: 'Chequia',         fr: 'Tchéquie',        pt: 'Chéquia' },
  // Group B
  CAN: { en: 'Canada',         es: 'Canadá',          fr: 'Canada',          pt: 'Canadá' },
  BIH: { en: 'Bosnia & Herzegovina', es: 'Bosnia y Herzegovina', fr: 'Bosnie-Herzégovine', pt: 'Bósnia e Herzegovina' },
  QAT: { en: 'Qatar',          es: 'Catar',           fr: 'Qatar',           pt: 'Catar' },
  SUI: { en: 'Switzerland',    es: 'Suiza',           fr: 'Suisse',          pt: 'Suíça' },
  // Group C
  BRA: { en: 'Brazil',         es: 'Brasil',          fr: 'Brésil',          pt: 'Brasil' },
  MAR: { en: 'Morocco',        es: 'Marruecos',       fr: 'Maroc',           pt: 'Marrocos' },
  HTI: { en: 'Haiti',          es: 'Haití',           fr: 'Haïti',           pt: 'Haiti' },
  SCO: { en: 'Scotland',       es: 'Escocia',         fr: 'Écosse',          pt: 'Escócia' },
  // Group D
  USA: { en: 'United States',  es: 'Estados Unidos',  fr: 'États-Unis',      pt: 'Estados Unidos' },
  PAR: { en: 'Paraguay',       es: 'Paraguay',        fr: 'Paraguay',        pt: 'Paraguai' },
  AUS: { en: 'Australia',      es: 'Australia',       fr: 'Australie',       pt: 'Austrália' },
  TUR: { en: 'Türkiye',        es: 'Turquía',         fr: 'Turquie',         pt: 'Turquia' },
  // Group E
  GER: { en: 'Germany',        es: 'Alemania',        fr: 'Allemagne',       pt: 'Alemanha' },
  CUW: { en: 'Curaçao',        es: 'Curazao',         fr: 'Curaçao',         pt: 'Curaçau' },
  CIV: { en: "Côte d'Ivoire",  es: 'Costa de Marfil', fr: "Côte d'Ivoire",   pt: 'Costa do Marfim' },
  ECU: { en: 'Ecuador',        es: 'Ecuador',         fr: 'Équateur',        pt: 'Equador' },
  // Group F
  NED: { en: 'Netherlands',    es: 'Países Bajos',    fr: 'Pays-Bas',        pt: 'Países Baixos' },
  JPN: { en: 'Japan',          es: 'Japón',           fr: 'Japon',           pt: 'Japão' },
  SWE: { en: 'Sweden',         es: 'Suecia',          fr: 'Suède',           pt: 'Suécia' },
  TUN: { en: 'Tunisia',        es: 'Túnez',           fr: 'Tunisie',         pt: 'Tunísia' },
  // Group G
  BEL: { en: 'Belgium',        es: 'Bélgica',         fr: 'Belgique',        pt: 'Bélgica' },
  EGY: { en: 'Egypt',          es: 'Egipto',          fr: 'Égypte',          pt: 'Egito' },
  IRN: { en: 'Iran',           es: 'Irán',            fr: 'Iran',            pt: 'Irão' },
  NZL: { en: 'New Zealand',    es: 'Nueva Zelanda',   fr: 'Nouvelle-Zélande', pt: 'Nova Zelândia' },
  // Group H
  ESP: { en: 'Spain',          es: 'España',          fr: 'Espagne',         pt: 'Espanha' },
  CPV: { en: 'Cape Verde',     es: 'Cabo Verde',      fr: 'Cap-Vert',        pt: 'Cabo Verde' },
  KSA: { en: 'Saudi Arabia',   es: 'Arabia Saudí',    fr: 'Arabie saoudite', pt: 'Arábia Saudita' },
  URU: { en: 'Uruguay',        es: 'Uruguay',         fr: 'Uruguay',         pt: 'Uruguai' },
  // Group I
  FRA: { en: 'France',         es: 'Francia',         fr: 'France',          pt: 'França' },
  SEN: { en: 'Senegal',        es: 'Senegal',         fr: 'Sénégal',         pt: 'Senegal' },
  IRQ: { en: 'Iraq',           es: 'Irak',            fr: 'Irak',            pt: 'Iraque' },
  NOR: { en: 'Norway',         es: 'Noruega',         fr: 'Norvège',         pt: 'Noruega' },
  // Group J
  ARG: { en: 'Argentina',      es: 'Argentina',       fr: 'Argentine',       pt: 'Argentina' },
  ALG: { en: 'Algeria',        es: 'Argelia',         fr: 'Algérie',         pt: 'Argélia' },
  AUT: { en: 'Austria',        es: 'Austria',         fr: 'Autriche',        pt: 'Áustria' },
  JOR: { en: 'Jordan',         es: 'Jordania',        fr: 'Jordanie',        pt: 'Jordânia' },
  // Group K
  POR: { en: 'Portugal',       es: 'Portugal',        fr: 'Portugal',        pt: 'Portugal' },
  COD: { en: 'DR Congo',       es: 'RD Congo',        fr: 'RD Congo',        pt: 'RD Congo' },
  UZB: { en: 'Uzbekistan',     es: 'Uzbekistán',      fr: 'Ouzbékistan',     pt: 'Uzbequistão' },
  COL: { en: 'Colombia',       es: 'Colombia',        fr: 'Colombie',        pt: 'Colômbia' },
  // Group L
  ENG: { en: 'England',        es: 'Inglaterra',      fr: 'Angleterre',      pt: 'Inglaterra' },
  CRO: { en: 'Croatia',        es: 'Croacia',         fr: 'Croatie',         pt: 'Croácia' },
  GHA: { en: 'Ghana',          es: 'Ghana',           fr: 'Ghana',           pt: 'Gana' },
  PAN: { en: 'Panama',         es: 'Panamá',          fr: 'Panama',          pt: 'Panamá' },
};

export function teamName(code: TeamCode, lang: Lang): string {
  const entry = TEAM_NAMES_I18N[code];
  if (!entry) return code;
  return entry[lang] ?? entry.en;
}
