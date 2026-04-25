# WCKO — World Cup KO bracket path

A single-page tool for analyzing one team's possible knockout path through the 2026 FIFA World Cup. Drag flags into opponent slots, set odds per match, see who you might face at every round with computed probabilities.

## Quick start

```bash
cd wcko
npm install
npm run dev
```

Then open <http://localhost:5173>.

## Build for production

```bash
npm run build
```

Outputs to `dist/`. Deploy that folder to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages).

## Tech stack

- **Vite + React 18 + TypeScript** — fast dev server, type safety, tree-shaken production bundle.
- **@dnd-kit/core** — accessible drag-and-drop with proper touch support (long-press on mobile so short taps still scroll).
- **Tailwind CSS** — utility classes, JIT-compiled in production.
- **No backend** — all state lives in the browser (`localStorage` for saved scenarios; share-via-URL for sharing).

## Project structure

```
src/
  data/
    teams.ts         # 48 teams, groups A-L, ISO2 flag codes
    bracket.ts       # R32 specs, parent links, MATCHES lookup
  logic/
    eligibility.ts   # which teams can occupy which slots (memoized)
    paths.ts         # analyzed team's path, opponent feeders, ancestor checks
    probability.ts   # winner-distribution computation
  state/
    scenario.ts      # default scenario shape
    storage.ts       # localStorage save/load
    shareLink.ts     # encode/decode scenario as ?s=... URL fragment
  components/
    TopBar.tsx       # team picker, finish buttons, save/load/share
    LeftRail.tsx     # team palette (full sidebar on desktop, top strip on mobile)
    RoundCard.tsx    # one of R32/R16/QF/SF/Final
    MatchBox.tsx     # individual match with two slots + odds input
    OpponentFeederTree.tsx  # mini-bracket subtree (R32 leaves leftmost)
    RoundMatchBox.tsx       # analyzed team's round-N match (top vs opponent)
    ResolvedOpponent.tsx    # single flag or sorted % list
    GroupCard.tsx, FlagImg.tsx, EmptyState.tsx
  App.tsx            # state, DndContext, sensors, all handlers
  main.tsx           # entry
  types.ts
```

## Behavior notes

- **Auto-placement.** Picking team + finish auto-places the team in their R32 slot (locked, can't be cleared or overwritten).
- **Eligibility.** Slots only accept teams that could plausibly occupy them (group/thirds/winnerOf computed transitively).
- **Same-path duplicates.** A team progressing through rounds (R32 → R16 → QF) is allowed; only placements at unrelated bracket positions de-dupe.
- **Explicit placement override.** Filling a higher-round slot directly overrides upstream computation — lets you skip the R32 detail.
- **No-odds default.** Match with both slots filled and no odds: 50/50 (unless 1° vs 3°, which auto-resolves to 1°).
- **Share-via-URL.** `?s=<base64>` encodes full scenario state. Anyone opening the link sees the same analysis.
- **PWA-ready.** Manifest + theme color set. "Add to Home Screen" works on iOS/Android.

## Deploy

Cloudflare Pages (recommended for scale — free tier has no bandwidth cap):

1. Push this folder to a git repo (GitHub/GitLab).
2. Cloudflare Pages → Create project → Connect repo.
3. Build command: `npm run build`. Output: `dist`. Node version: `20`.
4. Add custom domain: `wcko.io`.

## Live odds refresh (optional but recommended)

The team strength values that drive every probability calculation live in
`src/data/wc-win-prob.json`. The repo ships with editorial starter values, but
a GitHub Action can refresh them every 6 hours from The Odds API for live
bookmaker-quality numbers.

**One-time setup:**

1. Sign up at <https://the-odds-api.com> and grab an API key (the **$30/mo
   plan** is more than enough — 6h refresh = 4 calls/day = ~120/month).
2. In GitHub: repo → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret**. Name: `ODDS_API_KEY`, value: your key.
3. (Optional) Verify the sport key — visit
   `https://api.the-odds-api.com/v4/sports?apiKey=YOUR_KEY` and find the
   World Cup market. If it's not `soccer_fifa_world_cup_winner`, add a
   `SPORT_KEY` repo variable with the right one.
4. **Trigger the workflow once manually** to confirm: Actions tab → "Refresh
   WC odds" → "Run workflow". Should produce a commit updating
   `wc-win-prob.json`. Cloudflare picks it up and redeploys ~90s later.

After that, the workflow runs every 6h on its own. Cancel the API
subscription post-tournament to stop billing.

**Manual update fallback:** if you want to skip the API entirely, just edit
`src/data/wc-win-prob.json` directly and commit. The simulation picks up the
new values on the next build.

## Roadmap

- [ ] Real OG image (`public/og.png`, 1200x630) for proper social previews
- [ ] PNG icons (192, 512) for non-SVG-supporting Android launchers
- [ ] Lightweight analytics (Plausible or Cloudflare Web Analytics)
- [ ] Service worker for offline support after first load
- [ ] i18n: ES, PT, FR for global tournament audience

## License

MIT (your choice — add a LICENSE file).

---

Not affiliated with or endorsed by FIFA.
