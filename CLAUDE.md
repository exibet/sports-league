# Sports Leagues

Nuxt 4 app that lists TheSportsDB leagues with search, a sport filter, season badges in an
accordion and a server-rendered league page. A take-home assignment for a bookmaker company that
is moving to Nuxt: clarity of components, state, API integration and product logic is what gets
graded.

## Read first

- `docs/requirements.md` — the assignment verbatim, requirement IDs (R1–R13, E1), interpretation
- `docs/decisions.md` — stack, architecture, caching, state, testing, tooling, decision log (D1–D13)
- `docs/api.md` — what TheSportsDB really returns (edge cases, rate limit) and our own contract
- `docs/design.md` + `docs/design/` — visual spec, tokens, states, screenshots of the prototype
- `docs/plan.md` — the phased plan; the `phase` skill works through it step by step

When a decision changes, update `docs/decisions.md` in the same change.

## Commands

```bash
npm run dev            # dev server against the live API
npm run build          # production build ;  preview — serve it
npm run lint           # eslint --fix ;  lint:check — no fix (CI)
npm run typecheck      # nuxt typecheck (app, server, tests, configs)
npm run test           # vitest watch ;  test:run — once ;  test:coverage — node project + coverage
```

Planned: `dev:fixtures` (dev server + fixture server, added in P3.6); `test:smoke` and `test:e2e`
(Playwright against an existing production build and the fixture server, added in P4.5).

## Architecture in one screen

- `server/` — Nitro BFF: `GET /api/leagues`, `/api/leagues/:id/seasons`, `/api/leagues/:id`.
  Upstream calls go through one adapter in `server/utils/`: fetch with timeout and `retry: 0`,
  detect errors (429, `error code: 1015`, non-JSON) **before** normalising, map to our types,
  wrap in `defineCachedFunction` (explicit `name`/`getKey`, `event` passed first). API key and
  base URL come from server-only runtime config.
- `shared/` — types (`League`, `SeasonBadge`, `LeagueDetails`) and constants used by both sides.
- `app/stores/` — Pinia. The URL (`q`, `sport`, `open`, `season`) is the storage for list state;
  stores read `useRouter().currentRoute` and write with `router.replace`. Stores also hold the
  league list (with `fetchedAt`) and the per-league badge cache.
- `app/pages/` — `/` and `/leagues/[id]`. Pages load data with `await useAsyncData(...)` calling
  store actions, so SSR waits for it and the client reuses the payload.
- `app/components/` — domain components; Nuxt UI primitives inside them.

## Code rules

- **TypeScript strict**, pinned `~6.0` (TS 7 breaks `@typescript-eslint`). No `any`. `as` only at
  the upstream JSON trust boundary, with a comment saying why.
- **Upstream field names** (`strLeague`, `idLeague`, …) appear only in the server adapter and its
  tests. Everything else uses `shared/types`.
- **Data access:** components never call `$fetch`/`useFetch`; pages call store actions through
  `useAsyncData`; stores call our `/api`.
- **Stores:** never `useRoute()` inside a store; never `router.replace` during store setup or SSR;
  invalid query params are sanitised by derivation (getters fall back), never by rewriting the URL
  on load. In-flight promises live in a `Map` inside the setup closure, never in module scope or in
  returned state.
- **No duplicated state:** what lives in the URL is not copied into store state. The one allowed
  copy is the debounced search draft in `LeagueFilters` (instant typing, 250 ms debounced URL
  write, re-synced only when `q` changes from outside).
- **Server:** validate `:id` (digits, and present in the cached league list) before any upstream
  call; never cache an error; set `Cache-Control` in the handler on success only.
- **SSR safety:** no `window`/`document`/`localStorage` outside `onMounted` or
  `import.meta.client`; nothing time-dependent in the server render (the footer's "updated N min
  ago" and the theme toggle icon are client-only).
- **Styling:** colors, radii and fonts only through Nuxt UI semantic tokens / CSS variables. The
  single exception is the badge-plate token (see `docs/design.md`).
- **Icons:** local Iconify collections (`@iconify-json/*`), never the runtime Iconify API.
- **Accessibility:** touch targets ≥ 44 px, real `<button>`/`<a>`, `aria-label` on icon-only
  controls, decorative icons `aria-hidden`, the season picker is a radio group.
- **Lint:** no `console` in app, server and shared code (scripts and the fixture server may
  print), no semicolons, single quotes, `vue/max-len` 120.
- **Tests:** server adapter, utils and stores first; component tests only where behaviour matters.
  Tests and e2e use fixtures, never the live API.
- Everything in the repository is written in English.

## Verification loop

Every change: `npm run lint`, `npm run typecheck`, `npm run test:run`. Once the app renders (see
`docs/plan.md`), also `npm run build` and the Playwright smoke test (no console errors, no
hydration warnings). Never weaken a rule, threshold or test to make a check pass.

## Git

- Commit, push, open a PR or merge **only when the owner asks in chat**. Make the change, verify it,
  report, ask.
- Conventional Commits (`feat(leagues): …`), lowercase type, summary ≤ 72 chars, body lines ≤ 100.
- **Never add a `Co-Authored-By` trailer.** Never use `--no-verify`.
- All commits go to the local `main`, one per plan step; no phase branches, no PRs. The remote,
  CI on GitHub, Vercel and the `main` ruleset come at delivery (Phase 8 of `docs/plan.md`).

## Skills

- `/review` — review the current changes against `.claude/skills/review/checklist.md`.
- `/phase` — take the next step from `docs/plan.md`, implement it, verify, review, tick it and stop
  for approval.
