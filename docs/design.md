# Design

The prototype was built in Claude Design (a private canvas; screenshots of every board are in
`docs/design/`). It uses real API data: 10 leagues, their real season badges and current logos,
plus NBA and Formula 1 for the mixed-sports view. This file is the spec the implementation
follows.

## Screens

| Screenshot | What it shows |
|---|---|
| `design/list-desktop.png` | List page, 1280 px, one league expanded |
| `design/list-mobile.png` | List page, 390 px, mixed sports, sport dropdown visible |
| `design/league-desktop.png` | League page, 1280 px (English Premier League) |
| `design/league-mobile.png` | League page, 390 px (NBA) |
| `design/states.png` | Loading, empty, errors, no badges, more than 5 seasons |

## Tokens

Nuxt UI semantic tokens with the default palette: `neutral` = slate, `primary` = green. No
component hardcodes a color; everything goes through the tokens below.

| Token | Dark | Light |
|---|---|---|
| `--ui-bg` | slate-900 `#0f172a` | white |
| `--ui-bg-muted` / `elevated` | slate-800 `#1e293b` | slate-50 / slate-100 |
| `--ui-bg-accented` | slate-700 `#334155` | slate-200 |
| `--ui-border` | slate-800 | slate-200 |
| `--ui-text-muted` | slate-400 `#94a3b8` | slate-500 `#64748b` |
| `--ui-text` | slate-200 | slate-700 |
| `--ui-text-highlighted` | white | slate-900 |
| `--ui-primary` | green-400 `#4ade80` | **green-700** `#15803d` |

- Light theme uses green-700 for primary because white text on green-500 is only 2.3:1.
- **Badge plate:** badges and logos sit on a light plate (`#f1f5f9` dark theme, white light
  theme) in both themes, because league artwork is drawn for light backgrounds. This is the only
  deliberate non-theme color and lives in one token.
- **Font:** Public Sans 400/500/600/700, 800 italic for the wordmark.
- **Radii:** Nuxt UI defaults (6 px controls, 8 px cards and panels, 12 px league logo plate).

## Layout

- Content column max 960 px, side padding `clamp(16px, 4vw, 24px)`.
- **Header** (sticky, 64 px, translucent background with `backdrop-filter: blur(12px)`): logo
  mark (primary square with a ball icon, skewed −8°) + wordmark "SPORTS LEAGUES" (800 italic
  uppercase, "Leagues" in primary) linking home; GitHub link; theme toggle.
- **List page:** `h1` "Leagues" + one-line description → filters row (search grows 3:1 against
  the sport select, wraps on mobile) → count row ("10 leagues" / "3 of 12 leagues" + "Reset
  filters") → list card.
- **League row:** 52 px, 32 px sport icon tile, name (14/600) over sport (12, muted), chevron
  rotating 180° when open. One row open at a time.
- **Badge panel** (inside the open row) is a grid with a container query:
  - wide (> 520 px): `[badge 120] [info | "League details →"] / [badge] [season picker]`; the
    info top aligns with the badge top, the picker bottom with the badge bottom; the group is
    capped at 616 px.
  - narrow (≤ 520 px): `[badge 96] [info]`, picker full width below, link under it.
- **SeasonPicker:** ≤ 5 seasons → segmented control (44 px segments, selected = primary) built
  as a radio group; below a 340 px container the labels drop to 12 px. > 5 →
  `[‹] [Season 2016/17 ▾] [›]`.
- **Images:** badges and logos use the `/small` variant with explicit width and height.
- **Icons:** Iconify collections installed locally: UI icons from lucide; sport icons from tabler
  (`ball-football`, `ball-basketball`, `flag`, `trophy` for any other sport), which matches
  lucide's outline style.
- **League page:** "‹ All leagues" → hero (112 px logo plate, name `clamp(22px, 5vw, 30px)`,
  chips: sport, country, "Founded 1992", "Season 2026/27"; website link) → "About" (max 72ch) →
  "Season badges" grid `repeat(auto-fill, minmax(104px, 1fr))` with season captions.
- **Footer** (muted background): brand column (wordmark, one-liner, stack chips: Nuxt 4, Nuxt UI,
  Pinia, Nitro cache, Vercel) · "Data" column (pulsing dot + "TheSportsDB free API", "Updated N
  min ago" from `fetchedAt` — client-only, hidden when the list is not loaded, "Cached on the
  server for 4 hours") · "Project" column (Source code, API documentation) · bottom bar (© + "Not affiliated with TheSportsDB", "Back to top").

## States

| State | Where | Look |
|---|---|---|
| Loading leagues | list | skeleton search field, count, 6 skeleton rows |
| Nothing matches | list | dashed box, icon, "No leagues match "…"", "Clear filters" |
| Leagues failed | list | error alert, explanation, "Try again" |
| Badge loading | open row | skeleton badge, text lines and picker (first open only) |
| No badges | open row | dashed box "No season badges yet" + reason; link to league page stays |
| Badge request failed | open row | inline error alert + "Try again" (failure not cached) |
| League page loading | navigation | Nuxt loading bar on top; old page stays until data arrives |
| League not found | `/leagues/<unknown id>` | `error.vue`: "League not found", short reason, "‹ All leagues" (not in the prototype; same styles as the empty state) |

## Accessibility

- Touch targets ≥ 44 px (inputs, segments, icon buttons, links in rows and the footer).
- League row header is a `<button aria-expanded aria-controls>` inside an `h2`; the panel is a
  `role="region"` with a label.
- Season picker is a radio group (native radios sharing a name inside `role="radiogroup"`
  labelled "Season"): one tab stop, arrow keys move the selection. Not tabs — there are no tab
  panels.
- Count is `aria-live="polite"`; icon-only buttons have `aria-label`; decorative icons are
  `aria-hidden`; external links say "(opens in a new tab)" for screen readers.
- Text contrast ≥ 4.5:1 in both themes (see token notes).
