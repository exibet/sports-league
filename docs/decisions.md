# Decisions

What was decided before writing code, and why. Requirements are in `requirements.md` (R1–R13,
E1), API facts in `api.md`, the visual spec in `design.md`, the implementation plan in `plan.md`.

## 1. Goals and constraints

- **Graded on:** components, state management, API integration and product logic (E1). Behaviour
  and code clarity matter more than visuals.
- **Audience:** reviewers at a bookmaker company that is moving to Nuxt.
- **Time:** the brief mentions ~90 minutes and asks to explain anything beyond it (R13). This
  project does not aim for 90 minutes: it is built in phases, core brief (R1–R8) first, extras
  after.
- **Data limits:** the free API key returns 10 Soccer leagues and 5 old seasons per league
  (`api.md`).

## 2. Stack

| Concern | Choice | Version |
|---|---|---|
| Framework | Nuxt 4 (universal rendering) | 4.7 |
| UI kit | Nuxt UI (Reka UI + Tailwind CSS 4) | 4.13 |
| State | Pinia via `@pinia/nuxt` | 1.0 / pinia 4.1 |
| Composables | VueUse via `@vueuse/nuxt` (debounce, timers, listeners before writing our own) | 15.1 |
| Language | TypeScript, strict, **pinned `~6.0`** | 6.0 |
| Unit tests | Vitest + `@nuxt/test-utils` (projects `node` and `nuxt`) | 5.1 / 4.4 |
| E2E | Playwright, one project | — |
| Lint | `@nuxt/eslint` flat config | 1.17 |
| Hooks | husky + lint-staged + commitlint | — |
| Icons | Iconify collections installed locally (`@iconify-json/*`), no runtime API calls | — |
| Runtime | Node `^22.22.3 \|\| ^24.15.0 \|\| >=26` in `engines`, `.nvmrc` 24; npm | — |
| Hosting | Vercel, Git integration | — |

- **TypeScript is pinned to 6.0** because `typescript@latest` is 7.x and `@typescript-eslint` peers
  `<6.1`; an unpinned install breaks lint.
- **Why Nuxt UI:** the Nuxt team's own kit; accessible primitives (Reka UI), dark mode, semantic
  color tokens; installs `@nuxt/icon`, `@nuxt/fonts` and `@nuxtjs/color-mode` in one module. Our
  domain components stay the focus. Alternatives: shadcn-vue (dozens of copied files in the repo),
  PrimeVue (heavy, corporate look), no kit (more styling and a11y work).
- **"SPA":** a Nuxt universal app hydrates into an SPA; only the first request is server-rendered.
  Server rendering buys a hidden API key, a shared server cache, a fast first paint and SEO for
  league pages.

## 3. Architecture

### 3.1 Server layer (Nitro, backend-for-frontend)

The browser never calls TheSportsDB. Server-only runtime config, declared explicitly so the env
names map: `runtimeConfig.sportsdbApiKey` (`NUXT_SPORTSDB_API_KEY`, default `123`) and
`runtimeConfig.sportsdbBaseUrl` (`NUXT_SPORTSDB_BASE_URL`, default the public API; the fixture
server in tests and `dev:fixtures`).

| Route | Returns | Used by |
|---|---|---|
| `GET /api/leagues` | `{ leagues: League[], fetchedAt: number }` | list page |
| `GET /api/leagues/:id/seasons` | `SeasonBadge[]` | badge panel in the list |
| `GET /api/leagues/:id` | `{ details: LeagueDetails, seasons: SeasonBadge[] }` (two upstream calls in parallel) | league page |

- **One adapter** in `server/utils/` maps upstream fields to `shared/types`; components never see
  `strLeague`.
- **Validation:** `:id` must be digits **and** belong to the cached league list. Otherwise 400 or
  404 without a per-league upstream call, so crawlers cannot burn the rate limit or grow the cache.
- **Upstream fetch:** timeout on every call, `retry: 0` (ofetch retries GETs on 429/5xx by default,
  which doubles pressure on the limit).
- **Error detection before normalisation:** Cloudflare `error code: 1015`, HTTP 429, any non-JSON
  body and timeouts throw. Only then is the payload normalised, so an error can never be cached as
  "no badges".
- **Normalisation:** `seasons: null`, the error string and all-null badges become `[]`; seasons
  with a null badge are dropped; `leagues: null` from `lookupleague` → 404; descriptions keep the
  first paragraph with stripped-IPA fragments removed by one regex.
- **Error responses:** upstream failures → 502 with a readable message and `data.reason`, never
  cached, never leaking the key. A malformed id is a 400 before anything is loaded. Any other
  error (a bug of ours) is left to Nitro: a logged 500 with a generic message, not disguised as
  an upstream failure.
- **Trade-off, stated openly:** a server proxy puts every visitor behind one rate-limit bucket
  (and Vercel egress IPs are shared), where direct browser calls would each have their own.
  Mitigations: the server cache, request dedup, 404 for unknown ids, and warming every league's
  cache after each deploy (a plan step).

### 3.2 Caching (R8)

1. **Nitro, server side.** Upstream calls are `defineCachedFunction`s with an explicit `name` and
   `getKey` (league id), `swr: true`, called with `event` as the first argument so SWR
   revalidation survives on serverless (`waitUntil`). TTLs: leagues 30 min (owner decision; upstream
   sends `max-age` 4 h, but a shorter TTL keeps the list fresher), details 24 h, seasons 7 days (archive seasons never change). Function-level caching
   lets two routes share the seasons cache and keeps validation and error mapping outside it. The
   leagues value carries `fetchedAt`. Storage is in-memory (per Vercel instance, lost on cold
   start); Redis or Vercel KV is a one-line `nitro.storage` change (noted, not done). In
   development the cache is in-memory too (`nitro.devStorage`), so live data and fixture data
   (`dev:fixtures`) never mix on disk.
2. **HTTP.** Set in the handler **on success only**: `Cache-Control: public, max-age=60,
   s-maxage=<ttl>, stale-while-revalidate=<ttl>`. `max-age` is for the browser, `s-maxage` for the
   Vercel CDN. Server-rendered requests call `/api` in-process and bypass the CDN; the CDN helps
   client-side fetches.
3. **Client.**
   - The list page loads the leagues with `await callOnce('leagues', () => store.load(),
     { mode: 'navigation' })`: SSR waits, the browser reuses the Pinia payload instead of
     refetching, and coming back to the page runs it again (a no-op once loaded, a retry after a
     failure). The data lives in the store, so `useAsyncData` (whose result we would not use) is
     not needed.
   - The badge panel owns its data: `onServerPrefetch` loads it during SSR (a `?open=` URL renders
     complete) and `onMounted` on the client (an open, or a hand-made URL). Both go through the
     badge store, so a cached or in-flight entry makes no new request.
   - The badge cache lives in Pinia as a plain `Record<id, entry>`; in-flight promises sit in a
     `Map` inside the store's setup closure (not module scope, which would leak across SSR
     requests; not returned state, which must serialise). A repeat open makes no request, two
     parallel opens share one promise, a failure is evicted so "Try again" really retries.
   - Store requests to `/api` use `retry: 0`: ofetch repeats a failed GET once by default, which
     on a rate limit doubles the pressure. Retrying is the user's explicit "Try again".
   - The league page reuses the same cached seasons.

### 3.3 State (E1) — URL as storage, Pinia as interface

- **URL holds what reproduces the screen:** `?q=` (search), `?sport=`, `?open=` (expanded league),
  `?season=` (season of the expanded league).
- **Pinia is the interface:** components read `store.query`, `store.openId`, call `store.open(id)`,
  `store.setSport(…)`.
  - The store reads `useRouter().currentRoute`, **never `useRoute()`**: a store is a singleton,
    and `useRoute()` inside it can keep a stale page route after navigation.
  - Actions write with `router.replace` (no history spam; Back leaves the page). Never during store
    setup or SSR.
  - Invalid params (unknown sport, unknown id, unknown season, array values) are sanitised by
    derivation only: getters fall back, nothing throws, nothing rewrites the URL on load.
  - `open(id)` clears `season` in the same `replace`. A filter change that hides the open league
    drops `open` and `season` in the same `replace`.
  - Writes are serialised and built from a function of the current query. While another route is
    current (the league page is loading), getters keep the last list-route query and writes are
    no-ops, so the list does not flash empty and no write lands on the wrong page.
  - An open row whose badges are not cached (a hand-made URL) loads them when its panel mounts.
- **One allowed local copy:** `LeagueFilters` keeps a draft of the search text so typing is
  instant; it writes to the URL debounced (250 ms) and re-syncs only when `q` changes from
  outside (Back, reset); its own writes and other URL writes (`open`, `season`, `sport`) leave the
  draft and a pending write alone. Store writes are serialised, so none is lost.
- **Pinia also owns data:** the league list with `fetchedAt`, the badge cache, request status.

### 3.4 Pages and components

- `/` — list page: header, `h1`, filters, result count, league list, footer.
- `/leagues/[id]` — league page, server-rendered, **built last** (cuttable): logo, name, chips
  (sport, country, founded, current season), website, description, grid of all season badges;
  `useSeoMeta` (title, description, `og:image`). Unknown id → 404 through `createError` and
  `error.vue`. "‹ All leagues" calls `router.back()` when the previous entry is the list (so the
  filters come back with it), otherwise navigates to `/`.
- Domain components (starting point for the plan): `AppHeader`, `AppFooter`, `LeagueFilters`,
  `LeagueList`, `LeagueRow` (accordion row), `SeasonBadgePanel`, `SeasonPicker`, `LeagueHero`,
  `SeasonBadgeGrid`, plus loading, empty and error states.
- Nuxt UI inside: `UHeader`, `UContainer`, `UInput`, `USelect`, `UButton`, `UBadge`,
  `USkeleton`, `UAlert`, `UEmpty`, `UColorModeButton`; VueUse for debounce, time-ago and scrolling.
- `LeagueRow` is a hand-written accordion row, not `UAccordion`: `UAccordion` renders its header
  as a `div`, which would lose the `h2` around the row button that `design.md` requires. The season
  picker uses native radios rather than `URadioGroup`, whose variants do not give the filled
  segments of the design.

### 3.5 Product logic

- **Search:** case-, whitespace- and diacritics-insensitive (per-character fold), debounced, the
  matched fragment highlighted.
- **Sport dropdown:** options derived from the data, sorted, each with a league count; always
  shown, and disabled with a note when there is only one sport (R4; owner decision).
- **Result count** with `aria-live`, "Reset filters" when any filter is active, an empty state that
  names the query.
- **Accordion:** one league open at a time; first open shows a skeleton, repeat open is instant.
- **`SeasonPicker`** — both modes from the start:
  - ≤ 5 seasons → segmented control built as a radio group (native radios or `URadioGroup`, arrow
    keys work); short labels `1992/93`; below a 340 px container the labels drop to 12 px.
  - \> 5 seasons (paid key) → `[‹] [season select] [›]` stepper.
  - Covered by a component test for both modes.
- **No badges:** "No season badges yet" with the reason; the league link stays.
- **League page navigation:** first visit shows the Nuxt loading bar while data loads; repeat visit
  is instant.
- **Theme:** dark by default (`colorMode.preference: 'dark'`, default storage), light available via
  `UColorModeButton`. It renders both icons and the `dark` class (set before paint) shows one, so
  there is no hydration mismatch and no icon flash.
- **Footer "Updated N minutes ago":** rendered on the client only (`ClientOnly`, VueUse
  `useTimeAgo` with its default messages and refresh), and only when the leagues store has
  `fetchedAt` (so it is absent on a directly opened league page).
- **Images:** badges and logos use TheSportsDB's `/small` variant (~20 KB instead of ~48 KB) with
  explicit width, height and alt text.

## 4. Testing

- **Unit, `node` project (with coverage):** upstream adapter and normalisation (null, error string,
  null badges, `leagues: null`, description cleanup), error detection (429, 1015, non-JSON,
  timeout), id validation, search fold and filter, sport options, season label formatting.
- **Unit, `nuxt` project (no coverage — `@nuxt/test-utils` limitation):** Pinia stores against
  the test environment's memory-history router, whose `replace` is asynchronous (URL derivation,
  sanitising, `open` clearing `season`, filter dropping `open`), badge cache (no repeat request, shared promise, eviction on failure), `SeasonPicker` modes.
- **Coverage:** `include` = `server/**`, `shared/**`, `app/utils/**`; thresholds (lines 70,
  functions 70, branches 65) switch on in the plan step that lands the first server tests. Checked
  in CI, not in pre-commit.
- **Smoke (Playwright), right after the first UI step:** the list renders from a production build
  with zero console errors and zero hydration warnings. From then on every plan step runs
  `npm run build` and the smoke test.
- **E2E (Playwright), last testing phase:** runs against the build (`node .output/server/index.mjs`)
  with the fixture server as upstream; fixture images are served locally. Flows: search, sport
  filter, open/close and season switch, cached reopen (asserted by counting browser requests),
  league page and back, error and retry (via `page.route` on `/api/**`). 1015 mapping stays in unit
  tests. A separate `npm run screenshot` (not part of CI) captures the sport-dropdown screenshot
  for the README.
- **`npm run dev:fixtures`:** app + fixture server in one command, so a reviewer can try the sport
  filter locally (D1).

## 5. Repository, tooling, delivery

- **CI** (`.github/workflows/ci.yml`): `npm ci` → lint → typecheck → unit tests (both projects) →
  coverage (the `node` project again, with thresholds) → build → `npm audit` (non-blocking). A
  separate `E2E` job (build → Playwright) arrives with the smoke test (plan step P4.5) as a
  non-required check and becomes required with the `main` ruleset at delivery (plan step P8.6).
- **Hooks:** `pre-commit` → lint-staged (`eslint --fix`) + typecheck; `commit-msg` → commitlint
  (Conventional Commits). Coverage runs in CI.
- **ESLint:** the `@nuxt/eslint` module's `withNuxt` flat config (`createConfigForNuxt`
  underneath, aware of the project's directories) with stylistic (no semicolons, single quotes),
  `no-console: error` (allowed only in `scripts/**` and `tests/fixtures/**`, which print to the
  terminal), `@typescript-eslint/no-explicit-any: error`, `vue/max-len: 120`.
- **Git flow:** all work is committed locally on `main`, one commit per plan phase (made after the
  owner reviews the phase), with no phase branches and no PRs. Publishing comes last, at delivery: the first push and CI run, Vercel, then
  a ruleset on `main` (no deletion or force-push, linear history, PR required, rebase or squash
  merge, required checks "Lint, Typecheck, Test, Build" and `E2E`). History is never rewritten
  after the first push. Until then, every plan step runs the CI commands locally in CI order.
- **Vercel:** Git integration, Nuxt auto-detects the preset, no `vercel.json`. After each deploy,
  warm the cache for every league before sharing the link.
- **Not used:** dependabot (it would open PRs while the repo is being reviewed), extra Playwright
  browsers.
- **Language:** English everywhere in the repository.
- **Commits:** Conventional Commits, scope by area (`feat(leagues): …`), no `Co-Authored-By`
  trailer. Git steps happen only when the owner asks.
- **README:** what it is, live link, sport-filter screenshot and `npm run dev:fixtures` at the top,
  how to run, scripts, a link to `docs/`.

## 6. AI tooling in the repository

Published on purpose (the brief invites AI use and asks to describe it):

- `CLAUDE.md` — commands, architecture, code rules, git rules, pointers to `docs/`.
- `.claude/skills/review/` — reviews the current changes: lint, types, tests, build, then a
  project checklist (state and URL sync, caching, server adapter, SSR, security, a11y, tests).
- `.claude/skills/phase/` — runs one step of `docs/plan.md` at a time and stops before committing.

## 7. Decision log

| ID | Question | Decision |
|---|---|---|
| D1 | Showing the sport dropdown when live data has one sport | Always visible, disabled with a note on one sport; unit + e2e on mixed fixtures; README screenshot; `npm run dev:fixtures`; no demo data in production |
| D2 | E2E data source | Fixture server via `NUXT_SPORTSDB_BASE_URL`, against the production build |
| D3 | Theme | Dark by default, toggle, default storage; the toggle's icons switch by CSS, no flash |
| D4 | Where list state lives | URL (`q`, `sport`, `open`, `season`) as storage, Pinia as interface and data cache; store reads `useRouter().currentRoute` |
| D5 | Repository language | English everywhere |
| D6 | Repository | Public `exibet/sports-league` |
| D7 | AI tooling | `CLAUDE.md`, `docs/`, skills `review` and `phase`, all published |
| D8 | Design prototype in the repo | Screenshots in `docs/design/` |
| D9 | League details | Separate server-rendered page `/leagues/[id]`, built as the last feature phase; the list page never calls `lookupleague` |
| D10 | Badge UI in the list | Inline accordion panel with `SeasonPicker` and a "League details" link |
| D11 | Season picker | Both modes (segmented ≤ 5, stepper > 5) in the component from the start |
| D12 | Footer freshness line | Client-only, only when `fetchedAt` is known |
| D13 | Git flow | One local commit per phase on `main`, no branches or PRs; push, CI, Vercel and the ruleset at delivery |

## 8. Out of scope (next steps)

Favourites (pin a league; cookie so SSR keeps the order), country grouping with flags,
searching `strLeagueAlternate`, i18n, Redis/KV cache storage, a demo deployment on fixtures, match
lists and tables (the free key returns 1 event and 5 table rows).

## 9. Risks

- **Rate limit:** a cold server plus fast clicks can still hit it; the block duration is unknown.
  Mitigated by cache, dedup, 404 for unknown ids, cache warming; the error state is designed.
- **Vercel in-memory cache** is per instance; cold instances refetch. Acceptable for a demo.
- **Hydration/SSR bugs** are the main defect class; the smoke test and build run in every step.
- **Scope vs 90 minutes:** core first, extras cuttable.
- **Upstream data drift:** tests use fixtures and do not depend on it.
