#!/usr/bin/env node
// Refresh src/data/wc-win-prob.json from The Odds API.
// Run via: ODDS_API_KEY=xxx node scripts/refresh-odds.mjs
//
// Strategy:
//   1. Fetch outright winner odds for the WC2026 from all bookmakers we have access to
//   2. For each bookmaker, convert decimal odds to implied probabilities and de-vig
//      (normalize so the bookmaker's row sums to exactly 1)
//   3. For each team, take the median across bookmakers (more robust to outliers)
//   4. Re-normalize the entire team list so it sums to 1
//   5. Map API team names to our 3-letter codes; warn on unknowns; abort if too few
//   6. Write the result to src/data/wc-win-prob.json
//
// On error: exits non-zero without writing — the GitHub Action then fails loudly
// and the previously-deployed odds keep serving until the next successful refresh.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ODDS_FILE = resolve(SCRIPT_DIR, '../src/data/wc-win-prob.json');

const API_KEY = process.env.ODDS_API_KEY;
if (!API_KEY) {
  console.error('ERROR: ODDS_API_KEY env variable is required');
  process.exit(1);
}

// The Odds API sport key for WC2026 outright winner market. Override via env
// if their key changes — confirm at https://api.the-odds-api.com/v4/sports
const SPORT_KEY = process.env.SPORT_KEY || 'soccer_fifa_world_cup_winner';
const REGIONS = process.env.REGIONS || 'us,uk,eu';
const URL = `https://api.the-odds-api.com/v4/sports/${SPORT_KEY}/odds/?apiKey=${API_KEY}&regions=${REGIONS}&markets=outrights&oddsFormat=decimal`;

// Map API team names → our 3-letter codes. The Odds API uses common English
// names; multiple aliases handle minor variations between bookmakers.
const TEAM_NAME_TO_CODE = {
  // Group A
  'Mexico': 'MEX',
  'South Africa': 'RSA',
  'South Korea': 'KOR', 'Korea Republic': 'KOR',
  'Czech Republic': 'CZE', 'Czechia': 'CZE',
  // Group B
  'Canada': 'CAN',
  'Bosnia and Herzegovina': 'BIH', 'Bosnia & Herzegovina': 'BIH', 'Bosnia-Herzegovina': 'BIH',
  'Qatar': 'QAT',
  'Switzerland': 'SUI',
  // Group C
  'Brazil': 'BRA',
  'Morocco': 'MAR',
  'Haiti': 'HTI',
  'Scotland': 'SCO',
  // Group D
  'United States': 'USA', 'USA': 'USA', 'United States of America': 'USA', 'US': 'USA',
  'Paraguay': 'PAR',
  'Australia': 'AUS',
  'Turkey': 'TUR', 'Türkiye': 'TUR', 'Turkiye': 'TUR',
  // Group E
  'Germany': 'GER',
  'Curacao': 'CUW', 'Curaçao': 'CUW',
  "Cote d'Ivoire": 'CIV', "Côte d'Ivoire": 'CIV', 'Ivory Coast': 'CIV',
  'Ecuador': 'ECU',
  // Group F
  'Netherlands': 'NED', 'Holland': 'NED',
  'Japan': 'JPN',
  'Sweden': 'SWE',
  'Tunisia': 'TUN',
  // Group G
  'Belgium': 'BEL',
  'Egypt': 'EGY',
  'Iran': 'IRN', 'Iran (Islamic Republic of)': 'IRN', 'IR Iran': 'IRN',
  'New Zealand': 'NZL',
  // Group H
  'Spain': 'ESP',
  'Cape Verde': 'CPV', 'Cabo Verde': 'CPV',
  'Saudi Arabia': 'KSA',
  'Uruguay': 'URU',
  // Group I
  'France': 'FRA',
  'Senegal': 'SEN',
  'Iraq': 'IRQ',
  'Norway': 'NOR',
  // Group J
  'Argentina': 'ARG',
  'Algeria': 'ALG',
  'Austria': 'AUT',
  'Jordan': 'JOR',
  // Group K
  'Portugal': 'POR',
  'DR Congo': 'COD', 'Democratic Republic of the Congo': 'COD', 'Democratic Republic of Congo': 'COD', 'Congo DR': 'COD',
  'Uzbekistan': 'UZB',
  'Colombia': 'COL',
  // Group L
  'England': 'ENG',
  'Croatia': 'CRO',
  'Ghana': 'GHA',
  'Panama': 'PAN',
};

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function deVig(outcomes) {
  // Convert decimal odds → implied probability, normalize so they sum to 1
  const inverses = outcomes.map(o => ({ name: o.name, inv: 1 / o.price }));
  const total = inverses.reduce((s, x) => s + x.inv, 0);
  return inverses.map(x => ({ name: x.name, prob: x.inv / total }));
}

async function main() {
  console.log(`Fetching ${URL.replace(API_KEY, '****')}`);
  const res = await fetch(URL);
  if (!res.ok) {
    const body = await res.text();
    console.error(`API returned ${res.status}: ${body.slice(0, 500)}`);
    process.exit(1);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    console.error('API returned no events. Sport key may be wrong, or market not yet open.');
    process.exit(1);
  }
  console.log(`Got ${data.length} event(s); aggregating across bookmakers…`);

  // teamCode → array of probabilities (one per bookmaker that listed the team)
  const teamProbs = {};
  const unknownNames = new Set();

  for (const event of data) {
    for (const bookmaker of event.bookmakers ?? []) {
      const market = bookmaker.markets?.find(m => m.key === 'outrights');
      if (!market || !market.outcomes?.length) continue;
      const fair = deVig(market.outcomes);
      for (const { name, prob } of fair) {
        const code = TEAM_NAME_TO_CODE[name];
        if (!code) {
          unknownNames.add(name);
          continue;
        }
        if (!teamProbs[code]) teamProbs[code] = [];
        teamProbs[code].push(prob);
      }
    }
  }

  if (unknownNames.size > 0) {
    console.warn(`WARNING: ${unknownNames.size} unmapped team name(s) — add to TEAM_NAME_TO_CODE:`);
    for (const n of unknownNames) console.warn(`  "${n}"`);
  }

  const teamCount = Object.keys(teamProbs).length;
  if (teamCount < 30) {
    console.error(`Only ${teamCount} mapped teams (expected ~48). Aborting to avoid breaking the data.`);
    process.exit(1);
  }
  console.log(`Mapped ${teamCount} teams across ${data[0]?.bookmakers?.length ?? '?'} bookmakers`);

  // Median across bookmakers per team, then re-normalize to sum to 1
  const medianProbs = {};
  for (const [code, probs] of Object.entries(teamProbs)) {
    medianProbs[code] = median(probs);
  }
  const total = Object.values(medianProbs).reduce((a, b) => a + b, 0);
  const normalized = {};
  for (const [code, p] of Object.entries(medianProbs)) {
    // Round to 4 decimals (0.0001 = 0.01%)
    normalized[code] = Math.round((p / total) * 10000) / 10000;
  }

  // Sort by probability descending for readability in the JSON
  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const finalObj = Object.fromEntries(sorted);

  // Sanity check the total after rounding (should be ~1.0, allow some drift)
  const roundedTotal = sorted.reduce((s, [, p]) => s + p, 0);
  if (Math.abs(roundedTotal - 1.0) > 0.05) {
    console.error(`Total probability after normalization is ${roundedTotal.toFixed(4)}, expected ~1.0. Aborting.`);
    process.exit(1);
  }

  writeFileSync(ODDS_FILE, JSON.stringify(finalObj, null, 2) + '\n');
  console.log(`✓ Updated ${ODDS_FILE} (${sorted.length} teams, total ${roundedTotal.toFixed(4)})`);
  console.log(`  Top 5: ${sorted.slice(0, 5).map(([c, p]) => `${c} ${(p * 100).toFixed(1)}%`).join(', ')}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
