/**
 * Post-build script. Runs after `vite build`. Generates:
 *
 *   1. dist/og/<slug>.svg    — per-team OG image (1200×630, embedded flag)
 *   2. dist/<slug>.html      — per-team static HTML with custom title +
 *                              og:image + og:title + og:description meta
 *   3. dist/_redirects       — Cloudflare Pages routing: /<slug> → /<slug>.html,
 *                              with a catch-all SPA fallback at the end
 *
 * Why this exists: when wcko.io/argentina is shared on Twitter / Facebook /
 * Reddit / Discord, the scraper grabs the page meta tags BEFORE any JS runs.
 * Static per-team HTML lets each country URL have its own preview image and
 * title in the share card.
 *
 * Flag images are fetched from flagcdn.com at build time and embedded as
 * base64 data URIs inside the SVG, so the resulting OG image is fully
 * self-contained and doesn't depend on external resource fetching by the
 * social-media scraper.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// 48 teams: canonical slug, display name (English), ISO2 for flag CDN, accent
// colour (used as a thin bottom bar in the OG image — gives each one a
// distinctive splash without overwhelming the flag).
const TEAMS = [
  { code: 'MEX', slug: 'mexico',          name: 'Mexico',              iso: 'mx',     color: '#006847' },
  { code: 'RSA', slug: 'south-africa',    name: 'South Africa',        iso: 'za',     color: '#007A4D' },
  { code: 'KOR', slug: 'south-korea',     name: 'South Korea',         iso: 'kr',     color: '#003478' },
  { code: 'CZE', slug: 'czechia',         name: 'Czechia',             iso: 'cz',     color: '#11457E' },
  { code: 'CAN', slug: 'canada',          name: 'Canada',              iso: 'ca',     color: '#D52B1E' },
  { code: 'BIH', slug: 'bosnia',          name: 'Bosnia & Herzegovina', iso: 'ba',    color: '#002F6C' },
  { code: 'QAT', slug: 'qatar',           name: 'Qatar',               iso: 'qa',     color: '#8A1538' },
  { code: 'SUI', slug: 'switzerland',     name: 'Switzerland',         iso: 'ch',     color: '#DA291C' },
  { code: 'BRA', slug: 'brazil',          name: 'Brazil',              iso: 'br',     color: '#FEDD00' },
  { code: 'MAR', slug: 'morocco',         name: 'Morocco',             iso: 'ma',     color: '#C1272D' },
  { code: 'HTI', slug: 'haiti',           name: 'Haiti',               iso: 'ht',     color: '#00209F' },
  { code: 'SCO', slug: 'scotland',        name: 'Scotland',            iso: 'gb-sct', color: '#005EB8' },
  { code: 'USA', slug: 'united-states',   name: 'United States',       iso: 'us',     color: '#B22234' },
  { code: 'PAR', slug: 'paraguay',        name: 'Paraguay',            iso: 'py',     color: '#D52B1E' },
  { code: 'AUS', slug: 'australia',       name: 'Australia',           iso: 'au',     color: '#00843D' },
  { code: 'TUR', slug: 'turkiye',         name: 'Türkiye',             iso: 'tr',     color: '#E30A17' },
  { code: 'GER', slug: 'germany',         name: 'Germany',             iso: 'de',     color: '#000000' },
  { code: 'CUW', slug: 'curacao',         name: 'Curaçao',             iso: 'cw',     color: '#002B7F' },
  { code: 'CIV', slug: 'cote-divoire',    name: "Côte d'Ivoire",       iso: 'ci',     color: '#F77F00' },
  { code: 'ECU', slug: 'ecuador',         name: 'Ecuador',             iso: 'ec',     color: '#FFD100' },
  { code: 'NED', slug: 'netherlands',     name: 'Netherlands',         iso: 'nl',     color: '#FF6600' },
  { code: 'JPN', slug: 'japan',           name: 'Japan',               iso: 'jp',     color: '#BC002D' },
  { code: 'SWE', slug: 'sweden',          name: 'Sweden',              iso: 'se',     color: '#006AA7' },
  { code: 'TUN', slug: 'tunisia',         name: 'Tunisia',             iso: 'tn',     color: '#E70013' },
  { code: 'BEL', slug: 'belgium',         name: 'Belgium',             iso: 'be',     color: '#ED2939' },
  { code: 'EGY', slug: 'egypt',           name: 'Egypt',               iso: 'eg',     color: '#CE1126' },
  { code: 'IRN', slug: 'iran',            name: 'Iran',                iso: 'ir',     color: '#239F40' },
  { code: 'NZL', slug: 'new-zealand',     name: 'New Zealand',         iso: 'nz',     color: '#012169' },
  { code: 'ESP', slug: 'spain',           name: 'Spain',               iso: 'es',     color: '#AA151B' },
  { code: 'CPV', slug: 'cape-verde',      name: 'Cape Verde',          iso: 'cv',     color: '#003893' },
  { code: 'KSA', slug: 'saudi-arabia',    name: 'Saudi Arabia',        iso: 'sa',     color: '#006C35' },
  { code: 'URU', slug: 'uruguay',         name: 'Uruguay',             iso: 'uy',     color: '#0038A8' },
  { code: 'FRA', slug: 'france',          name: 'France',              iso: 'fr',     color: '#002654' },
  { code: 'SEN', slug: 'senegal',         name: 'Senegal',             iso: 'sn',     color: '#00853F' },
  { code: 'IRQ', slug: 'iraq',            name: 'Iraq',                iso: 'iq',     color: '#CE1126' },
  { code: 'NOR', slug: 'norway',          name: 'Norway',              iso: 'no',     color: '#BA0C2F' },
  { code: 'ARG', slug: 'argentina',       name: 'Argentina',           iso: 'ar',     color: '#75AADB' },
  { code: 'ALG', slug: 'algeria',         name: 'Algeria',             iso: 'dz',     color: '#006233' },
  { code: 'AUT', slug: 'austria',         name: 'Austria',             iso: 'at',     color: '#ED2939' },
  { code: 'JOR', slug: 'jordan',          name: 'Jordan',              iso: 'jo',     color: '#000000' },
  { code: 'POR', slug: 'portugal',        name: 'Portugal',            iso: 'pt',     color: '#006600' },
  { code: 'COD', slug: 'dr-congo',        name: 'DR Congo',            iso: 'cd',     color: '#007FFF' },
  { code: 'UZB', slug: 'uzbekistan',      name: 'Uzbekistan',          iso: 'uz',     color: '#1EB53A' },
  { code: 'COL', slug: 'colombia',        name: 'Colombia',            iso: 'co',     color: '#FCD116' },
  { code: 'ENG', slug: 'england',         name: 'England',             iso: 'gb-eng', color: '#CE1124' },
  { code: 'CRO', slug: 'croatia',         name: 'Croatia',             iso: 'hr',     color: '#171796' },
  { code: 'GHA', slug: 'ghana',           name: 'Ghana',               iso: 'gh',     color: '#FCD116' },
  { code: 'PAN', slug: 'panama',          name: 'Panama',              iso: 'pa',     color: '#005AA7' },
];

/** XML-escape a string so it's safe to interpolate into SVG text content. */
function xmlEscape(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
}

/** Build a 1200×630 SVG OG image for a team, with the flag embedded as a
 *  base64 PNG data URI (so social scrapers don't need to fetch it externally). */
function ogSvg({ name, color, flagDataUri }) {
  const safeName = xmlEscape(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f3f4f6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Flag, left-anchored -->
  <image href="${flagDataUri}" x="60" y="155" width="400" height="300" preserveAspectRatio="xMidYMid meet"/>

  <!-- Team name + tagline + brand -->
  <text x="500" y="265" font-family="-apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="92" font-weight="800" fill="#1e3a8a">${safeName}</text>
  <text x="500" y="335" font-family="-apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="42" font-weight="600" fill="#374151">Path to Glory</text>
  <text x="500" y="395" font-family="-apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="28" fill="#6b7280">2026 World Cup knockout simulator</text>

  <!-- WCKO wordmark, top-right -->
  <text x="1140" y="80" text-anchor="end" font-family="-apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="40" font-weight="800" fill="#1e3a8a" stroke="#10b981" stroke-width="0.6">WCKO</text>

  <!-- Team-coloured bar -->
  <rect x="0" y="610" width="1200" height="20" fill="${color}"/>
</svg>`;
}

async function fetchFlag(iso) {
  const url = `https://flagcdn.com/w640/${iso}.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Flag fetch failed for ${iso}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function generateOgImages() {
  await mkdir(join(DIST, 'og'), { recursive: true });
  // Fetch flags in parallel — flagcdn handles the load fine.
  const flagPromises = TEAMS.map(async t => {
    try {
      return [t, await fetchFlag(t.iso)];
    } catch (e) {
      console.warn(`  ⚠ ${t.code}: ${e.message} — falling back to text-only`);
      return [t, null];
    }
  });
  const results = await Promise.all(flagPromises);
  for (const [team, flagDataUri] of results) {
    const svg = ogSvg({
      name: team.name,
      color: team.color,
      flagDataUri: flagDataUri ?? '',
    });
    await writeFile(join(DIST, 'og', `${team.slug}.svg`), svg);
  }
  console.log(`  ✓ ${TEAMS.length} OG images written to dist/og/`);
}

/** Replace one of the meta tags in the index.html string. The regex matches
 *  the `content="…"` attribute of a tag whose `property=` or `name=` equals
 *  the given key.
 *
 *  index.html uses double-quoted attributes throughout, so we anchor on `"`
 *  explicitly. (The earlier `[^"']*` version silently failed on og:title /
 *  twitter:title because the existing content contained the apostrophe in
 *  "team's", terminating the character class early and skipping the
 *  replacement.) */
function setMeta(html, attrKey, key, newContent) {
  const safe = newContent.replace(/"/g, '&quot;');
  const re = new RegExp(`(<meta\\s+${attrKey}="${key}"[^>]*content=)"[^"]*"`, 'i');
  return html.replace(re, `$1"${safe}"`);
}

function customizeHtml(template, team) {
  const title = `${team.name}'s Path to Glory — WCKO`;
  const description = `Visualise ${team.name}'s knockout path at the 2026 World Cup. Drag opponents, set odds, share with friends.`;
  const url = `https://wcko.io/${team.slug}`;
  const image = `https://wcko.io/og/${team.slug}.svg`;

  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:image', image);

  // og:description + twitter:description aren't in the source index.html yet,
  // so inject them just before </head> if not already present.
  if (!/og:description/.test(html)) {
    const inject = `    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />\n    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />\n  `;
    html = html.replace('</head>', inject + '</head>');
  }
  return html;
}

async function generateTeamPages() {
  const indexHtml = await readFile(join(DIST, 'index.html'), 'utf8');
  for (const team of TEAMS) {
    const html = customizeHtml(indexHtml, team);
    await writeFile(join(DIST, `${team.slug}.html`), html);
  }
  console.log(`  ✓ ${TEAMS.length} team HTML pages written to dist/`);
}

async function writeRedirects() {
  const lines = [
    '# Generated by scripts/build-team-pages.mjs — DO NOT EDIT BY HAND.',
    '# Per-team static HTML for promotable URLs (custom OG meta per country).',
    '',
    ...TEAMS.map(t => `/${t.slug}\t/${t.slug}.html\t200`),
    '',
    '# SPA fallback for everything else (aliases like /arg, /brasil resolve',
    '# client-side via teamFromSlug — see src/state/teamSlugs.ts).',
    '/*\t/index.html\t200',
    '',
  ];
  await writeFile(join(DIST, '_redirects'), lines.join('\n'));
  console.log(`  ✓ _redirects updated with ${TEAMS.length} team rules + SPA fallback`);
}

console.log('build-team-pages: generating per-team OG images, HTML, and redirects…');
await generateOgImages();
await generateTeamPages();
await writeRedirects();
console.log('build-team-pages: done.');
