# Plan

This is the phased implementation plan for the project described in `docs/requirements.md` (R1–R13, E1) and `docs/decisions.md` (D1–D13).
Run it with the `phase` skill (`/phase` or `/phase P3.2`): one step per run — tests first, implement, verify, review, tick, propose a commit, stop.
Legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[-]` cut (with a `Notes:` line giving the reason); a `Notes:` line is otherwise added only when the result differs from the plan.
Core comes first: Phases 2–4 deliver the whole core brief (R1–R8). Phases 5, 6 and 7 are each independently shippable and cuttable; Phase 8 (delivery) always runs and adapts to what was cut.
Every git action (init, commit, push, PR, merge) and every dashboard action happens only on the owner's explicit request; steps marked **(owner)** need the owner's hands.
Commits follow Conventional Commits (lowercase, summary ≤ 72 chars, scope by area, no `Co-Authored-By` trailer, never `--no-verify`).
Each phase ends in **one commit**: its steps accumulate in the working tree, the owner reviews the whole phase at its checkpoint, and the commit is made on the owner's command. Its summary names the phase; its body lists the steps' `Commit:` lines; the ticked `docs/plan.md` travels with it. Phases 2–5 were committed on the local `main`. After Phase 5 the owner had `main` published early (repository, CI, Vercel, ruleset — the work of P8.4–P8.6, done by a separate deploy agent); from Phase 6 on, phases are committed on `dev` and reach `main` through a `dev` → `main` PR that the owner merges (D13).
Phase gate: a phase starts only after the previous phase's checkpoint has passed and the owner approves. The last step of a phase stops at the checkpoint, which is verified locally: the CI commands in CI order and the production build (`npm run build && npm run preview`).
Ticks of owner steps and of P2.8 (whose "Done when" is only true after its commit) ride in the next commit; P8.7 is never ticked in the repository. Phase 8 is the exception to one commit per phase: P8.1–P8.3 form its local commit, and P8.4–P8.7 publish.
A cut phase marks its steps `[-]` (the ticks ride in the next step's commit) and follows the "If this phase is cut" line in its header.
Once P4.5 is `[x]`, every step also runs `npm run build` and `npm run test:smoke`.

---

## Phase 1 — Idea, technology and design (done)

- [x] **P1.1 — Requirements analysis** — assignment kept verbatim, requirement IDs and interpretation notes: [`docs/requirements.md`](./requirements.md).
- [x] **P1.2 — API research** — observed behaviour of the upstream API on the free key, edge cases, rate limit, our server→client contract: [`docs/api.md`](./api.md).
- [x] **P1.3 — Stack choice** — Nuxt 4, Nuxt UI, Pinia, pinned TypeScript, Vitest, Playwright, Vercel: [`docs/decisions.md` §2](./decisions.md).
- [x] **P1.4 — Design prototype and screenshots** — visual spec, tokens, states, accessibility: [`docs/design.md`](./design.md), [`docs/design/`](./design/).
- [x] **P1.5 — Architecture and decisions** — server layer, caching, state, testing, tooling, decision log D1–D13: [`docs/decisions.md`](./decisions.md).
- [x] **P1.6 — Independent review of the docs** — findings and the owner's answers are folded into the revised `requirements.md`, `decisions.md` (§3, §4, §7), `api.md` and `design.md`.
- [x] **P1.7 — Implementation plan** — this file; step contract in [`.claude/skills/phase/SKILL.md`](../.claude/skills/phase/SKILL.md), review checklist in [`.claude/skills/review/checklist.md`](../.claude/skills/review/checklist.md).

---

## Phase 2 — Scaffold and tooling

Phase 2 is the one exception to "one step, one commit": D13 wants a single initial commit (docs + scaffold + CI + hooks) on `main`. Steps P2.1–P2.7 accumulate in the working tree and P2.8 proposes that one commit. When the `phase` skill asks about changes left by earlier P2 steps, the answer is "they belong to the phase".

- [x] **P2.1 — Minimal Nuxt 4 app**
  - Goal: A hand-written minimal Nuxt 4 app that installs, starts and builds. Written by hand because the directory already holds `docs/`, so no template leftovers.
  - Depends on: P1.7
  - Files: `package.json`, `package-lock.json`, `nuxt.config.ts`, `tsconfig.json`, `app/app.vue`, `public/favicon.svg`, `.nvmrc`, `.gitignore`, `.env.example`
  - Tests: none (no logic yet)
  - Done when: `typescript` is pinned `~6.0`; `engines.node` is `^22.22.3 || ^24.15.0` (the first plan also had `|| >=26`; dropped after Vercel built on Node 26, see P8.5) and `.nvmrc` is `24`; versions match `decisions.md` §2; scripts `dev`, `build`, `preview`, `postinstall: nuxt prepare` exist; `.gitignore` covers `node_modules`, `.nuxt`, `.output`, `.data`, `.env`, `coverage`, `test-results`, `playwright-report`, `blob-report`, `.nitro`, `.cache`, `dist`, `.env.*` (with `!.env.example`), `.DS_Store`, `.vercel`, `*.log`, `.claude/settings.local.json`; a favicon exists and `app.head` declares it (a missing one would later fail the "zero console errors" smoke check); `.env.example` lists `NUXT_SPORTSDB_API_KEY=123` and `NUXT_SPORTSDB_BASE_URL`.
  - Verify: `npm install` finishes with no peer-dependency errors and without `--legacy-peer-deps`; `npm run build` passes; `npm run dev` serves a page with a placeholder heading.
  - Out of scope: UI kit, state, lint, tests, runtime config values (P3.5).
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R9, R11

- [x] **P2.2 — Nuxt UI, Pinia, color mode, fonts, icons, tokens**
  - Goal: Install the UI and state foundation, and set the design tokens once so no later component hardcodes a color.
  - Depends on: P2.1
  - Files: `package.json`, `nuxt.config.ts`, `app/app.vue`, `app/app.config.ts`, `app/assets/css/main.css`
  - Tests: none
  - Done when:
    - modules `@nuxt/ui` and `@pinia/nuxt` are registered and `app.vue` wraps the page in `UApp`;
    - `app.config.ts` sets `primary: 'green'`, `neutral: 'slate'`;
    - `main.css` imports Tailwind and Nuxt UI, sets Public Sans as the sans font (weights 400–700 plus 800 italic for the wordmark, configured explicitly so the browser does not synthesise them), overrides `--ui-primary` to green-700 in light and green-400 in dark, and defines the single badge-plate token (`design.md` Tokens);
    - `colorMode.preference` is `'dark'`;
    - local Iconify collections are installed (`@iconify-json/lucide` plus one collection that has soccer, basketball and motorsport icons), with the runtime Iconify API fallback disabled in the icon module options (check the option name against the installed version).
  - Verify: `npm run build`; in dev the page is dark with slate background and Public Sans, a `UButton` is green and a `UIcon` from each collection renders; the network tab shows no request to an external icon or font host.
  - Out of scope: header, footer, theme toggle (P5.1); any domain component.
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R6, R9

- [x] **P2.3 — ESLint and typecheck**
  - Goal: Lint and type checks exactly as `decisions.md` §5 describes, runnable locally and in CI.
  - Depends on: P2.2
  - Files: `package.json`, `nuxt.config.ts`, `eslint.config.mjs`
  - Tests: none
  - Done when: flat config from `@nuxt/eslint` with stylistic rules (no semicolons, single quotes), `no-console: error` with one override that allows `console` in `scripts/**` and `tests/fixtures/**` (command-line output), `@typescript-eslint/no-explicit-any: error` (set explicitly: strict mode only catches implicit `any`), `vue/max-len: 120`; scripts `lint` (`eslint . --fix`), `lint:check` (`eslint .`), `typecheck` (`nuxt typecheck`, `vue-tsc` installed); TypeScript strict is on, and `nuxt typecheck` also checks `tests/**`: `tests/unit/server/**` under the server tsconfig, `tests/unit/app/**` and `tests/nuxt/**` under the app tsconfig, `tests/e2e/**` and config files under the node tsconfig (verify the include names against the generated `.nuxt/tsconfig.*.json`).
  - Verify: `npm run lint:check` and `npm run typecheck` pass; a temporary `console.log`, an explicit `any` and a type error inside a test file are each caught, then removed.
  - Out of scope: hooks (P2.5), CI (P2.6).
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R11, E1

- [x] **P2.4 — Vitest projects and coverage config**
  - Goal: Two Vitest projects (`node`, `nuxt`) and a coverage config, proven by one real test in the Nuxt environment.
  - Depends on: P2.3
  - Files: `package.json`, `vitest.config.ts`, `tests/nuxt/app.test.ts`
  - Tests: `app.vue` mounts in the Nuxt environment and renders the placeholder heading.
  - Done when:
    - project `node` includes `tests/unit/**/*.test.ts`; project `nuxt` (via `@nuxt/test-utils`) includes `tests/nuxt/**/*.test.ts`;
    - the `node` project resolves the `#shared`, `~` and `~~` aliases the way Nuxt does (`resolve.alias`), so server code imports work unchanged in tests;
    - coverage uses the v8 provider with `include` = `server/**`, `shared/**`, `app/utils/**`, and thresholds are present but commented as "enabled in P3.2";
    - scripts: `test` (watch), `test:run` (both projects, once), `test:coverage` (`node` project only, with coverage);
    - the `node` project temporarily runs with `--passWithNoTests`, to be removed in P3.2.
  - Verify: `npm run test:run` passes (1 test); `npm run test:coverage` exits 0; a temporary type error in `tests/nuxt/app.test.ts` fails `npm run typecheck`.
  - Out of scope: Playwright (P4.5); any production code.
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R11

- [x] **P2.5 — Git repository and commit hooks (owner approves `git init`)**
  - Goal: Initialise the repository on `main` and install the hooks so the very first commit is already checked.
  - Depends on: P2.4
  - Files: `package.json`, `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.mjs`
  - Tests: none
  - Done when: `git init -b main` was run after the owner said so; `prepare: husky` (verify the installed husky exits 0 without `.git`, as on Vercel; otherwise `husky || true`); `pre-commit` runs lint-staged (`eslint --fix` on staged `*.{ts,vue,mjs}`) and `npm run typecheck`; `commit-msg` runs commitlint with the conventional config, header ≤ 72, body lines ≤ 100; `npm run prepare` was run after `git init` and `git config core.hooksPath` prints `.husky/_`; nothing is staged or committed.
  - Verify: `echo "Bad message" | npx commitlint` fails; `echo "chore: scaffold nuxt app" | npx commitlint` passes; `npx lint-staged --help` runs.
  - Out of scope: any commit; remote setup.
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R10, R11

- [x] **P2.6 — CI workflow**
  - Goal: One CI job whose name matches the required check of the future ruleset.
  - Depends on: P2.5
  - Files: `.github/workflows/ci.yml`
  - Tests: none
  - Done when: the job is named exactly `Lint, Typecheck, Test, Build`; it triggers on `pull_request` and on `push` to `main`; steps are checkout → setup Node from `.nvmrc` with npm cache → `npm ci` → `lint:check` → `typecheck` → `test:run` → `test:coverage` → `build` → `npm audit` with `continue-on-error`; concurrency cancels superseded runs.
  - Verify: the YAML parses (`npx --yes yaml-lint` or an editor check); each command of the job passes locally in the same order.
  - Out of scope: the e2e job (P4.5); deployment (Vercel uses its own Git integration).
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R11

- [x] **P2.7 — README stub and command list**
  - Goal: The published docs are consistent with the scaffold on day one.
  - Depends on: P2.6
  - Files: `README.md`, `CLAUDE.md`
  - Tests: none
  - Done when: `README.md` has the title, one paragraph, "how to run" (`npm install`, `npm run dev`) and a link to `docs/`; the "Commands" block in `CLAUDE.md` lists only scripts that exist now, with the planned ones (`dev:fixtures`, `test:smoke`, `test:e2e`) marked "added in P3.6 / P4.5".
  - Verify: every script named in `README.md` and `CLAUDE.md` exists in `package.json` or is marked as planned; `grep -rn "TODO" README.md` shows only intended placeholders.
  - Out of scope: the final README content (P8.1).
  - Commit: none — folded into the initial commit proposed in P2.8
  - Requirements: R11

- [x] **P2.8 — Initial commit (owner)**
  - Goal: One commit on `main` with docs, scaffold, tooling, CI and hooks.
  - Depends on: P2.7
  - Files: none (git only)
  - Tests: none
  - Done when: the owner asked for the commit; the full verification loop and a full-scope `review` pass on the tree; `package-lock.json` has `linux-x64` entries for the native optional dependencies (otherwise it is regenerated from a clean tree before committing); the commit went through the hooks.
  - Verify: `git log --oneline` shows exactly one commit.
  - Notes: the first push, the first CI run, the ruleset (former P2.9) and Vercel (former P2.10) moved to Phase 8 (P8.4–P8.6) by the owner's decision; no remote until then.
  - Out of scope: any feature code.
  - Commit: `chore: scaffold nuxt app with tooling, ci and docs`
  - Requirements: R10, R11

**Checkpoint (Phase 2):** one commit on `main`; the full verification loop is green locally.

---

## Phase 3 — Server layer and caching

Covers only what the list page needs (`all_leagues`, `search_all_seasons`). The league-details upstream call belongs to Phase 6, so Phase 6 stays cuttable.

- [x] **P3.1 — Shared types and upstream fixtures**
  - Goal: One type definition for both sides, and captured upstream payloads that all later tests and the fixture server reuse.
  - Depends on: P2.8
  - Files: `shared/types/league.ts`, `tests/fixtures/upstream/all_leagues.live.json`, `tests/fixtures/upstream/all_leagues.mixed.json`, `tests/fixtures/upstream/seasons/*.json` (one per fixture league, all 12; 4329 and 4338 are the real all-null ones), `tests/fixtures/upstream/rate-limited.txt`, `tests/fixtures/README.md`
  - Tests: none (data and types only)
  - Done when: `League` and `SeasonBadge` match `api.md` "Our contract" (`LeagueDetails` is added in P6.1); fixtures cover the 10 live leagues, a mixed list (10 Soccer + Basketball + Motorsport), seasons with badges, seasons with all-null badges, `{"seasons":null}`, the error-string response, a single-year season format and the plain-text `error code: 1015` body; live captures are taken once, sequentially with a pause of at least 2 s; image URLs in fixtures use a `{{FIXTURE_ORIGIN}}` placeholder; the fixtures README says which files are real captures and which are synthetic.
  - Verify: `npm run typecheck`; every JSON file parses (`node -e` over the directory).
  - Out of scope: any code that reads the fixtures.
  - Commit: `test(api): add shared types and upstream fixtures`
  - Notes: the capture hit the rate limit after ten requests (2.5 s apart), so `seasons/4338.json`, 4387, 4370, the unknown-id and invalid-id responses are synthetic, reproducing `api.md`; `rate-limited.txt` is a real capture (HTTP 429). The unknown-id and invalid-id files are `seasons-unknown-id.json` and `seasons-invalid-id.json` next to `seasons/`.
  - Requirements: R1, R7, E1

- [x] **P3.2 — Upstream client with error detection**
  - Goal: One function that performs an upstream GET and throws on every failure mode before anything is normalised.
  - Depends on: P3.1
  - Files: `server/utils/sportsdb/client.ts`, `server/utils/sportsdb/errors.ts`, `tests/unit/server/client.test.ts`, `vitest.config.ts`, `package.json`
  - Tests:
    - happy path returns parsed JSON;
    - HTTP 429 throws `UpstreamError('rate-limited')`;
    - a 200 body `error code: 1015` throws rate-limited;
    - an HTML or other non-JSON body throws `invalid-response`;
    - a timeout throws `timeout`;
    - a network failure throws `unreachable`;
    - the fetch is attempted exactly once (`retry: 0`);
    - the error message never contains the API key or the full upstream URL.
  - Done when: the client takes `{ baseUrl, apiKey, timeoutMs }` as arguments (no runtime-config access inside, so it is testable in the `node` project); it uses `ofetch` imported explicitly (a direct dependency; there is no global `$fetch` in the `node` project) with `retry: 0`, a timeout and `responseType: 'text'`, and parses the body itself; tests replace the global `fetch` that ofetch calls (`vi.stubGlobal`), never call the network; the timeout test uses a small real timeout and a stubbed `fetch` that rejects on abort (fake timers do not drive `AbortSignal`); coverage thresholds (lines 70, functions 70, branches 65) are enabled and `--passWithNoTests` is removed.
  - Verify: `npm run test:coverage` passes with thresholds on; a temporary type error in `tests/unit/server/client.test.ts` fails `npm run typecheck`.
  - Out of scope: mapping to our types (P3.3), HTTP status mapping (P3.4), caching (P3.5).
  - Commit: `feat(api): add upstream client with error detection`
  - Notes: changed in the Phase 5 review: no test-only `fetch` option; ofetch's `baseURL` joins the base URL (no manual slash trimming) and tests stub the global `fetch`.
  - Requirements: R1, R7, R8, E1

- [x] **P3.3 — Normalise leagues and season badges**
  - Goal: Pure mappers from upstream payloads to `League[]` and `SeasonBadge[]`; the only place upstream field names appear.
  - Depends on: P3.2
  - Files: `server/utils/sportsdb/normalise.ts`, `tests/unit/server/normalise.test.ts`
  - Tests:
    - leagues map `idLeague/strLeague/strSport` to `id/name/sport`;
    - `leagues: null` or a non-array throws `invalid-response` (never an empty list);
    - seasons with badges map in upstream order;
    - null-badge seasons are dropped;
    - all-null → `[]`;
    - `seasons: null` → `[]`;
    - the error string → `[]`;
    - badge URLs get the `/small` suffix exactly once.
  - Done when: `as` casts exist only at the JSON trust boundary with a comment; all JSON fixture files from P3.1 are exercised (`rate-limited.txt` belongs to the P3.2 client test).
  - Verify: `npm run test:coverage`.
  - Out of scope: details and description cleanup (P6.1).
  - Commit: `feat(api): normalise leagues and season badges`
  - Requirements: R1, R2, R7

- [x] **P3.4 — League id validation and HTTP error mapping**
  - Goal: Decide 400/404 before any upstream call, and turn upstream failures into a readable 502.
  - Depends on: P3.3
  - Files: `package.json`, `server/utils/league-id.ts`, `server/utils/http-errors.ts`, `tests/unit/server/league-id.test.ts`, `tests/unit/server/http-errors.test.ts`
  - Tests:
    - `abc`, empty and `12a` → 400;
    - digits not in the known id list (a 30-digit string included) → 404;
    - a known id → returned as a string;
    - each `UpstreamError` kind → 502 with its own short message;
    - any other error passes through unchanged (Nitro answers 500 and logs it);
    - no message contains the key or upstream host.
  - Done when: both helpers are pure (the known ids are passed in) and import `createError` explicitly from `h3`, which becomes a direct dependency here (`npm ls h3` shows one copy, the same major as Nitro's).
  - Verify: `npm run test:coverage`.
  - Out of scope: route handlers.
  - Commit: `feat(api): validate league ids and map upstream errors`
  - Notes: changed in the phase review: an unknown error is no longer a generic 502 (that hid our own bugs as upstream failures and was never logged); the id check is split into `parseLeagueId` (400, before anything is loaded) and `assertKnownLeague` (404).
  - Requirements: R7, R8

- [x] **P3.5 — Cached functions, runtime config and the two list routes**
  - Goal: `GET /api/leagues` and `GET /api/leagues/:id/seasons` backed by `defineCachedFunction`, with HTTP cache headers on success only.
  - Depends on: P3.4
  - Files: `nuxt.config.ts`, `server/utils/cached.ts`, `server/api/leagues/index.get.ts`, `server/api/leagues/[id]/seasons.get.ts`, `tests/unit/helpers/nitro.ts`, `tests/unit/server/routes.test.ts`
  - Tests:
    - `/api/leagues` returns `{ leagues, fetchedAt }` and sets `Cache-Control: public, max-age=60, s-maxage=1800, stale-while-revalidate=1800` (30 min; 4 h in the first plan, shortened by the owner);
    - the seasons route with a bad id → 400 and with an unknown id → 404, with the seasons upstream function not called in either case;
    - a known id returns `SeasonBadge[]` with `s-maxage=604800`;
    - an upstream failure → 502 with **no** `Cache-Control` header;
    - each cached function is declared with an explicit `name`, `swr: true` and the documented `maxAge`; the seasons function's `getKey` is built from the league id, the leagues function's key is constant;
    - when the leagues function throws during id validation, the seasons route answers 502 with no `Cache-Control`, never 404;
    - with a memoising fake of `defineCachedFunction` that, like Nitro, never stores a thrown error: a repeat call makes no upstream request, and a call after a failure reaches upstream again (the real Nitro behaviour is checked in P3.6 Verify through the fixture log).
  - Done when:
    - `runtimeConfig.sportsdbApiKey` (default `123`) and `runtimeConfig.sportsdbBaseUrl` (default public API) are server-only;
    - cached functions take `event` as the first argument;
    - `fetchedAt` is stamped inside the cached leagues function;
    - the dev cache storage is in-memory (`nitro.devStorage`), so live and fixture data can never mix on disk;
    - handlers import the `h3` helpers (`defineEventHandler`, param and header helpers, `createError`) explicitly; the test helper replaces only `defineCachedFunction` (a recording pass-through, plus the memoising fake above) and `useRuntimeConfig`, installed before the handlers are imported; handlers and `cached.ts` also import the project's own `server/utils` explicitly (Nitro auto-imports them, plain Vitest does not); handlers stay thin.
  - Verify: `npm run dev`, then `curl -i` on `/api/leagues`, `/api/leagues/4328/seasons`, `/api/leagues/4329/seasons` (→ `[]`), `/api/leagues/abc/seasons` (400) and `/api/leagues/999999/seasons` (404); a second call to the same URL is served without a new upstream request (dev log or timing).
  - Out of scope: `/api/leagues/:id` (P6.1); `routeRules` caching (would also cache errors).
  - Commit: `feat(api): add cached league and season badge routes`
  - Requirements: R1, R7, R8, E1

- [x] **P3.6 — Fixture server and `dev:fixtures`**
  - Goal: A zero-dependency local stand-in for the upstream API, used by `dev:fixtures` now and by Playwright from P4.5. Brought forward from the e2e phase because the sport dropdown cannot be developed or reviewed on live data.
  - Depends on: P3.5
  - Files: `tests/fixtures/server.mjs`, `tests/fixtures/images/*.png` (a few tiny files), `scripts/dev-fixtures.mjs`, `package.json`, `CLAUDE.md`
  - Tests: none (exercised by the smoke test and e2e)
  - Done when:
    - the server answers `/<key>/all_leagues.php` (mixed list) and `/<key>/search_all_seasons.php?badge=1&id=` (per-id fixture, `{"seasons":null}` for unknown ids) on a fixed port for `dev:fixtures` (e2e uses a different one, P4.5);
    - it serves images locally, including the `/small` suffix, replacing `{{FIXTURE_ORIGIN}}` at response time;
    - it logs each request;
    - `npm run dev:fixtures` starts it and `nuxt dev` with `NUXT_SPORTSDB_BASE_URL` pointing at it, and stops both on Ctrl+C;
    - `CLAUDE.md` marks the command as available.
  - Verify: `npm run dev:fixtures`, then `curl /api/leagues` shows three sports and `/api/leagues/4328/seasons` returns 5 items; the fixture log shows no second request for a repeated call. Then run `nuxt dev` with `NUXT_SPORTSDB_BASE_URL` pointing at the fixture port while the fixture server is stopped: an uncached `/api/leagues/<id>/seasons` answers 502 without `Cache-Control`; start the fixture server and the same URL answers 200, with the request visible in the fixture log (a failure was not cached).
  - Out of scope: Playwright config (P4.5); failure-injection endpoints (e2e uses `page.route`); the README screenshot (P7.4).
  - Commit: `test(api): add fixture server and dev:fixtures script`
  - Requirements: R4, R8, R11

**Checkpoint (Phase 3):** commits P3.1–P3.6 on `main`. The CI commands pass locally with coverage thresholds on. On the local production build (live data): `/api/leagues` returns 10 leagues with `fetchedAt`; `/api/leagues/4328/seasons` returns 5 badges; `…/4329/seasons` returns `[]`; `…/abc/seasons` is 400; `…/999999/seasons` is 404; success responses carry the exact `Cache-Control` values, error responses none. The deployed behaviour (the CDN consuming `s-maxage`) is checked in P8.5.

---

## Phase 4 — State and the list page (completes the core brief R1–R8)

- [x] **P4.1 — Search utilities**
  - Goal: Pure functions for the search: fold, match, and highlight ranges that align with the original string.
  - Depends on: P3.6
  - Files: `app/utils/search.ts`, `tests/unit/app/search.test.ts`
  - Tests:
    - fold lowercases, trims, collapses inner whitespace and strips diacritics per character;
    - an empty or whitespace-only query matches everything;
    - `"premier"` matches "English Premier League";
    - `"jupiler"` matches a name with an accent;
    - highlight returns `[start, end)` ranges in **original** string indices, including when a diacritic precedes the match;
    - ranges stay correct when several spaces in a row precede or sit inside the match (collapsing whitespace shifts indices too);
    - no match → an empty range list.
  - Done when: no regex is built from user input; functions have no Vue imports; `app/utils/**` uses explicit imports only (it is tested in the `node` project, where Nuxt auto-imports do not exist).
  - Verify: `npm run test:coverage`.
  - Out of scope: components, debounce.
  - Commit: `feat(leagues): add diacritics-insensitive search utils`
  - Requirements: R3, E1

- [x] **P4.2 — Sport options, season labels, query-param helpers**
  - Goal: The remaining pure helpers the stores and components need.
  - Depends on: P4.1
  - Files: `nuxt.config.ts`, `app/utils/sports.ts`, `app/utils/season.ts`, `app/utils/query.ts`, `tests/unit/app/sports.test.ts`, `tests/unit/app/season.test.ts`, `tests/unit/app/query.test.ts`
  - Tests:
    - sport options are derived from the leagues, sorted, with counts;
    - a single sport yields one option;
    - a sport→icon lookup falls back to a generic icon;
    - `1992-1993` → `1992/93`, `1999-2000` → `1999/00`, `1950` → `1950`, unexpected input is returned unchanged;
    - a query param that is an array, empty or not a string → `undefined`;
    - building the next query drops empty values and keeps unrelated params.
  - Done when: all helpers are pure and covered; the sport icon names from `sports.ts` are listed in the icon module's client bundle (`icon.clientBundle.icons`; verify the option name), because the bundle scan may skip `.ts` files.
  - Verify: `npm run test:coverage`.
  - Out of scope: stores.
  - Commit: `feat(leagues): add sport, season and query helpers`
  - Requirements: R4, R7

- [x] **P4.3 — Leagues data store**
  - Goal: A Pinia store that owns the league list, `fetchedAt` and request status, and loads through our `/api`.
  - Depends on: P4.2
  - Files: `app/stores/leagues.ts`, `tests/nuxt/stores/leagues.test.ts`
  - Tests:
    - `load()` fills `leagues`, `fetchedAt` and `status: 'success'`;
    - a second `load()` makes no request;
    - two parallel `load()` calls share one request;
    - a failure sets `status: 'error'` with a string message and does not throw;
    - a `load()` after a failure retries;
    - `sportOptions` comes from P4.2.
  - Done when: state is serialisable (no `Error` objects, no promises); the in-flight promise lives in the setup closure; the store uses the global `$fetch` with a relative URL (in-process on the server).
  - Verify: `npm run test:run`.
  - Out of scope: URL state (P4.6); rendering.
  - Commit: `feat(leagues): add leagues store`
  - Notes: `$fetch` uses `retry: 0` (ofetch retries a failed GET once by default); recorded in `decisions.md` §3.2. The badge store does the same. No `force` option: `load()` already retries whenever the last attempt failed (phase review).
  - Requirements: R1, R8, E1

- [x] **P4.4 — List page, first render**
  - Goal: `/` server-renders the league list with name and sport — the first rendering step.
  - Depends on: P4.3
  - Files: `app/pages/index.vue`, `app/layouts/default.vue`, `app/components/LeagueList.vue`, `app/components/LeagueRow.vue`, `app/app.vue`, `tests/nuxt/app.test.ts`
  - Tests: update the app mount test to assert the `h1` "Leagues" and one row per league, each showing both the name and the sport, from a mocked `/api/leagues`.
  - Done when:
    - the page uses `await callOnce('leagues', () => store.load(), { mode: 'navigation' })` (the data lives in the store, so no `useAsyncData` result is needed);
    - the layout is a bare 960 px column (header and footer come in P5);
    - the `h1` "Leagues" is followed by the one-line description from `design.md`;
    - each row shows the sport icon tile, name and sport with a stable `:key`, non-interactive for now;
    - `useSeoMeta` sets the title and description;
    - view-source contains the league names and no `/api/leagues` request appears in the browser after hydration.
  - Verify: `npm run build && node .output/server/index.mjs` against the fixture server (`NUXT_SPORTSDB_BASE_URL`), then view-source and the network tab.
  - Out of scope: filters, accordion, states, header, footer.
  - Commit: `feat(leagues): render league list page`
  - Requirements: R1, R2, R5, R6

- [x] **P4.5 — Playwright smoke test and e2e CI job**
  - Goal: Catch SSR and hydration defects from now on: the production build renders the list with a clean console.
  - Depends on: P4.4
  - Files: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/helpers.ts`, `package.json`, `.github/workflows/ci.yml`, `CLAUDE.md`
  - Tests: smoke — open `/`, expect the `h1` and 12 fixture rows; zero console errors and warnings (any message matching `/hydration/i` fails); zero page errors; every request goes to a local origin (no upstream API, no external icon or font host); the same page at a 390 px viewport has no horizontal scroll (`scrollWidth` ≤ `clientWidth`). If Chromium reports a preloaded font as unused, fix the preload rather than filter the warning.
  - Done when:
    - one Chromium project;
    - a console guard in `tests/e2e/helpers.ts` fails a test on any console error, warning or page error, and takes a per-test list of expected messages (for example the `Failed to load resource … 404/502` line that a test provokes on purpose); every spec uses it;
    - `webServer` starts the fixture server and `node .output/server/index.mjs` with the fixture base URL, both on fixed ports different from `dev:fixtures`, so a running dev session does not clash;
    - scripts `test:smoke` (smoke spec only) and `test:e2e` (all specs) both expect an existing build;
    - a separate CI job `E2E` (build → install Chromium → `test:e2e`, report uploaded on failure) runs on every push but is not a required check until P8.6;
    - the `CLAUDE.md` commands block is updated.
  - Verify: once per machine `npx playwright install chromium`; `npm run build && npm run test:smoke` passes; temporarily rendering `Date.now()` in the page makes it fail, then revert.
  - Out of scope: feature flows (P7).
  - Commit: `test(e2e): add playwright smoke test and ci job`
  - Requirements: R11, R6

- [x] **P4.6 — List state store: search and sport in the URL**
  - Goal: The URL-as-storage store for filters: derive `query` and `sport` from the route, write with `router.replace`.
  - Depends on: P4.5
  - Files: `app/stores/leagueList.ts`, `tests/nuxt/stores/leagueList.filters.test.ts`
  - Tests (the real memory-history router of the Nuxt test environment, so `replace` is asynchronous):
    - `query` and `sport` derive from `currentRoute`;
    - an unknown sport, array or empty values fall back without throwing and without any `replace`;
    - `filtered` applies search and sport;
    - `setQuery` and `setSport` call `replace` once with the merged query, empty values removed;
    - `reset` clears `q` and `sport` in one `replace`;
    - two writes in a row (`setQuery` then `setSport`) both end up in the URL;
    - `setQuery` writes the text as typed (a trailing space survives); only empty or whitespace-only values are dropped, and folding happens at match time;
    - while another route is current (the league page is loading), `query` and `sport` keep the last list-route values and every write is a no-op;
    - `hasActiveFilters`;
    - no `replace` happens during store setup.
  - Done when: the store reads `useRouter().currentRoute` (never `useRoute()`); it holds no copy of URL state; one internal `patchQuery` helper performs all writes, serialised: each write waits for the previous `replace` before reading `currentRoute`, so no write is lost (the pending promise lives in the setup closure); `patchQuery` takes a function of the current query, so checks such as "does this hide the open league" run inside the serialised section; the getters derive from the last list-route query (a computed that keeps its previous value while another route is current, not a copy in state).
  - Verify: `npm run test:run`.
  - Out of scope: `open` and `season` (P4.10); components.
  - Commit: `feat(leagues): sync search and sport filters with url`
  - Requirements: R3, R4, E1

- [x] **P4.7 — LeagueFilters, result count, reset**
  - Goal: The filters row and the count row from `design.md`.
  - Depends on: P4.6
  - Files: `app/components/LeagueFilters.vue`, `app/components/LeagueCount.vue`, `app/pages/index.vue`, `tests/nuxt/components/LeagueFilters.test.ts`
  - Tests:
    - typing updates the input at once and calls `setQuery` once after 250 ms (fake timers enabled after mounting, advanced with `advanceTimersByTimeAsync`);
    - an outside change of `q` (Back, reset) re-syncs the draft and cancels a pending write;
    - a route change that leaves `q` alone keeps the draft and the pending write: a foreign `router.replace` adding an unrelated param within 250 ms ends with the typed text in the input and both params in the URL;
    - typing on while the debounced `replace` is still resolving loses no characters;
    - a trailing space ("english ") survives the debounced write;
    - reset with a pending write leaves `q` empty;
    - the sport select is always present with counts in the labels: disabled with a note for one sport, enabled for several;
    - choosing "All sports" removes the param (driven through the select's `update:modelValue`; the real click path is covered in P7.1).
  - Done when:
    - `UInput` has a label and a clear button;
    - `USelect` uses a non-empty sentinel value for "All sports" (the select primitive rejects empty-string values);
    - search and select are 3:1 and wrap on mobile;
    - the count reads "12 leagues" or "3 of 12 leagues" in an `aria-live="polite"` element;
    - "Reset filters" shows only when a filter is active;
    - the draft never re-syncs from a value this component wrote itself;
    - the pending debounce timer is cleared on unmount.
  - Verify: `npm run dev:fixtures` — type, pick a sport, reload: the screen is reproduced from the URL and Back leaves the page. Then build + smoke.
  - Out of scope: highlight and empty state (P4.8).
  - Commit: `feat(leagues): add search and sport filter controls`
  - Notes: changed after the phase checkpoint by the owner: the sport select is always shown (disabled with a note for one sport) instead of hidden; the browser's own clear button of `type="search"` is hidden, so only our "Clear search" button shows.
  - Requirements: R3, R4, R5, R6

- [x] **P4.8 — Match highlight and list states**
  - Goal: The highlighted match in rows, and the empty, loading and error states of the list.
  - Depends on: P4.7
  - Files: `app/components/HighlightedText.vue`, `app/components/LeagueRow.vue`, `app/components/LeagueListEmpty.vue`, `app/components/LeagueListSkeleton.vue`, `app/components/LeagueListError.vue`, `app/pages/index.vue`, `tests/nuxt/components/HighlightedText.test.ts`
  - Tests: highlighted text renders `<mark>` around the ranges from P4.1 and plain text elsewhere; markup in the input is rendered as text.
  - Done when:
    - no `v-html` is used;
    - the empty state names the query and offers "Clear filters";
    - the error state is a `UAlert` with an explanation and "Try again" calling `load()`;
    - the skeleton (search, count, 6 rows) shows while status is pending (seen during a retry);
    - looks match `docs/design/states.png`.
  - Verify: `dev:fixtures` — a query with no results; run `nuxt dev` with `NUXT_SPORTSDB_BASE_URL` pointing at the fixture port while the fixture server is not running to see the error state, then start the fixture server and press "Try again". Then build + smoke.
  - Out of scope: badge panel states (P4.12).
  - Commit: `feat(leagues): add match highlight and list states`
  - Requirements: R3, R6, R5

- [x] **P4.9 — Season badge cache store**
  - Goal: The client cache for season badges (R8): one request per league, shared in-flight promise, failures evicted.
  - Depends on: P4.8
  - Files: `app/stores/seasonBadges.ts`, `tests/nuxt/stores/seasonBadges.test.ts`
  - Tests:
    - the first `load(id)` requests `/api/leagues/:id/seasons` and stores the entry;
    - a repeat `load(id)` makes no request;
    - two parallel loads share one request;
    - a failure produces an error entry state, and the next `load(id)` requests again;
    - different ids are cached independently;
    - `[]` is a valid cached success;
    - `load` never throws.
  - Done when: the cache is a plain `Record<id, entry>` in state; in-flight promises sit in a `Map` in the setup closure, neither in module scope nor in returned state.
  - Verify: `npm run test:run`.
  - Out of scope: UI; the URL.
  - Commit: `feat(badges): add season badge cache store`
  - Requirements: R7, R8, E1

- [x] **P4.10 — Accordion state in the URL and the row button**
  - Goal: `?open=` and `?season=` in the list store, and a league row that toggles.
  - Depends on: P4.9
  - Files: `app/stores/leagueList.ts`, `app/components/LeagueRow.vue`, `app/components/LeagueList.vue`, `tests/nuxt/stores/leagueList.accordion.test.ts`, `tests/nuxt/components/LeagueFilters.test.ts`
  - Tests:
    - `openId` derives from the route and is `null` for an unknown id or one not in the filtered list;
    - `open(id)` sets `open` and clears `season` in the same `replace` (the panel loads the badges, P4.12);
    - `open` on another id replaces the first;
    - `close()` drops both params;
    - `setQuery` or `setSport` that hides the open league drops `open` and `season` in the same `replace`;
    - `season` derives from `?season=` as written (the panel falls back to the first season, P4.12);
    - `setSeason` writes `season`;
    - `open(id)` then `setQuery` in the same tick: the hide-check sees the new `open`;
    - (in `LeagueFilters.test.ts`) typing, then opening a matching league within 250 ms, ends with the typed text in the input and both `q` and `open` in the URL.
  - Done when: the row header is a `<button aria-expanded aria-controls>` inside an `h2`, 52 px high, with a rotating chevron; only one row is open; the panel region exists with a label and placeholder content.
  - Verify: `dev:fixtures` — open, switch rows, filter the open row away, reload with `?open=`. Then build + smoke.
  - Out of scope: panel content (P4.12).
  - Commit: `feat(leagues): add accordion state synced with url`
  - Requirements: R7, E1, R5

- [x] **P4.11 — SeasonPicker with both modes**
  - Goal: The season picker as a standalone controlled component: segmented radio group up to 5 seasons, stepper above (D11).
  - Depends on: P4.10
  - Files: `app/components/SeasonPicker.vue`, `tests/nuxt/components/SeasonPicker.test.ts`
  - Tests:
    - 5 seasons render a radio group with 5 radios, short labels and the model value checked;
    - choosing a radio emits the season;
    - 6 or more seasons render previous / select / next, checked with 6 and with 30 seasons (the layout does not grow with the count);
    - previous is disabled on the first and next on the last;
    - stepping emits the neighbour;
    - one season renders without controls that do nothing.
  - Done when: props are `seasons` and `modelValue` only (no store access); segments are 44 px; it is a single tab stop with arrow keys; labels drop to 12 px below a 340 px container (container query); the stepper buttons have `aria-label`s.
  - Verify: `npm run test:run`. The free key never returns more than 5 seasons, so no fixture or page shows the stepper mode; this component test proves it, and P7.2 checks it in a browser with a stubbed response.
  - Out of scope: the panel layout.
  - Commit: `feat(badges): add season picker with segmented and stepper modes`
  - Requirements: R7, R5, R6

- [x] **P4.12 — SeasonBadgePanel, its states and SSR preload**
  - Goal: Clicking a league shows a season badge (R7), with loading, empty and error states; a URL with `?open=` is server-rendered complete.
  - Depends on: P4.11
  - Files: `app/components/SeasonBadgePanel.vue`, `app/components/LeagueRow.vue`, `app/pages/index.vue`, `tests/nuxt/components/SeasonBadgePanel.test.ts`, `tests/e2e/smoke.spec.ts`
  - Tests:
    - the panel shows the badge of `?season=` (or the first season when it is missing or unknown) with alt text, width and height;
    - picking a season calls `setSeason`;
    - a pending entry shows the skeleton;
    - `[]` shows "No season badges yet" with the reason;
    - an error entry shows the alert, and "Try again" calls `load(id)` again;
    - a panel mounted with no cache entry (for example after a hand-made URL) calls `load(id)` itself;
    - the smoke test gains one case — `/?open=<id>&season=<s>` renders the badge with a clean console.
  - Done when:
    - the badge sits on the badge-plate token;
    - the layout follows the container-query grid of `design.md` (wide > 520 px, narrow ≤ 520 px);
    - the panel loads its badges in `onServerPrefetch` (SSR) and `onMounted` (client), so a `?open=` URL is server-rendered and no client request follows SSR;
    - a repeat open is instant with no request;
    - there is no "League details" link yet (P6.4).
  - Verify: `dev:fixtures` — open a league with badges and one with none; the network tab shows one seasons request per league; at 320 and 390 px there is no horizontal scroll, the filters wrap and the panel uses its narrow layout. Then build + smoke.
  - Out of scope: the league page link; header and footer.
  - Commit: `feat(badges): show season badge panel in league rows`
  - Notes: the smoke test also checks an open league at 320 px; it caught the season picker overflowing (a `fieldset` keeps its min-content width), so the picker is a `div role="radiogroup"` of native radios whose segments may shrink. After the phase review: the list page uses `callOnce` instead of `useAsyncData` returning `true`; the panel is the only place that loads badges; `selectedSeason` left the list store (the panel derives the season from `?season=`); the empty states use `UEmpty`; `SeasonPicker` uses `defineModel`.
  - Requirements: R7, R8, R5, R6

**Checkpoint (Phase 4):** commits P4.1–P4.12 on `main`. The CI commands and `npm run test:e2e` pass locally. On the local production build (live data): 10 leagues render server-side, search filters and highlights, the sport dropdown is disabled with its note (one sport), opening a league shows a badge, reopening makes no request, reload with `?q=&open=&season=` reproduces the screen, the console is clean, and at 390 px there is no horizontal scroll and the panel uses its narrow layout. **The core brief R1–R8 is complete here; everything after is cuttable.**

---

## Phase 5 — Polish (cuttable)

If this phase is cut: mark its steps `[-]`, drop "the footer freshness line is absent" from the Phase 6 checkpoint and "in both themes" from P8.7, and in P8 adjust `design.md` (header, footer), `decisions.md` §3.5 (theme, footer), D3 and D12, and the SSR-safety rule in `CLAUDE.md` (it names the footer and the theme toggle).

- [x] **P5.1 — AppHeader and theme toggle**
  - Goal: The sticky header from `design.md` with a hydration-safe theme toggle.
  - Depends on: P4.12
  - Files: `app/components/AppHeader.vue`, `app/components/AppWordmark.vue`, `app/layouts/default.vue`, `shared/constants.ts`, `app/assets/css/main.css`
  - Tests: none new (the smoke test guards hydration)
  - Done when: the header is Nuxt UI `UHeader` (64 px, sticky, translucent, 12 px blur) inside a full-height flex column with `UContainer` as `main` (on a short page the footer sits at the bottom of the screen; the smoke test checks it); logo mark and wordmark link home; the GitHub link (URL from `shared/constants.ts`) opens in a new tab with `rel="noopener noreferrer"` and screen-reader text; `UColorModeButton` renders both icons and the `dark` class shows one (no flash, nothing time-dependent to hydrate); icon buttons and links have ≥ 44 px targets with `aria-label`; `scroll-padding-top` keeps a focused row out from under the sticky header; the light theme uses green-700 primary and the badge plate is correct in both themes.
  - Verify: toggle the theme, reload (the preference persists, no flash of the wrong icon); build + smoke.
  - Out of scope: the footer.
  - Commit: `feat(ui): add app header with theme toggle`
  - Notes: changed from the first plan: no `ClientOnly` for the toggle (Nuxt UI switches its icons by CSS) and `UHeader` instead of a hand-written sticky header (phase review). `UMain` was tried and dropped: it is a full screen tall and pushed the footer below the fold. The logo and wordmark are one `AppWordmark`, reused by the footer.
  - Requirements: R6, R5

- [x] **P5.2 — AppFooter with the client-only freshness line**
  - Goal: The footer from `design.md`; "Updated N min ago" appears only on the client and only when `fetchedAt` is known (D12).
  - Depends on: P5.1
  - Files: `app/components/AppFooter.vue`, `app/components/DataFreshness.vue`, `app/layouts/default.vue`, `tests/e2e/smoke.spec.ts`
  - Tests: the smoke test sees the client-only "Updated …" line after hydration, with a clean console.
  - Done when: three columns (brand, Project, Data — Data last) on one rhythm (a 28 px heading row, then lines 8 px apart) plus the bottom bar with the links from `design.md`; the freshness line is VueUse `useTimeAgo` with its default messages and refresh, inside `ClientOnly`, guarded by `fetchedAt`; nothing time-dependent is in the server HTML; footer links keep ≥ 44 px targets; "Back to top" works and respects `prefers-reduced-motion`, as does the pulsing dot.
  - Verify: view-source of `/` has no "min ago" text; build + smoke.
  - Out of scope: the league page.
  - Commit: `feat(ui): add app footer with data freshness`
  - Notes: changed from the first plan (`relativeTime.ts` with its unit tests and our own 60 s interval): VueUse `useTimeAgo` already formats and refreshes, so neither is needed. "Back to top" uses VueUse `useWindowScroll`; the columns follow the owner's order and one shared rhythm.
  - Requirements: R6, R5

- [x] **P5.3 — Accessibility pass**
  - Goal: Walk `design.md` "Accessibility" and checklist group J over the list page and fix what fails.
  - Depends on: P5.2
  - Files: the components touched by the findings (expected: `LeagueRow.vue`, `SeasonBadgePanel.vue`, `LeagueFilters.vue`, `SeasonPicker.vue`)
  - Tests: add an assertion to an existing component test for each fix that changes behaviour (for example, focus stays on the row button after close).
  - Done when: the whole page is operable by keyboard alone (search, select, rows, picker, retry, reset); focus is visible and never lost after closing a panel or resetting filters; all targets are ≥ 44 px; decorative icons are `aria-hidden`; the count is announced; text contrast is ≥ 4.5:1 in both themes (spot-check muted text and primary on background).
  - Verify: a keyboard-only walk-through in both themes; a screen-reader spot check of the row button and the picker; build + smoke.
  - Out of scope: visual redesign; the league page.
  - Commit: `fix(a11y): keyboard, focus and target size pass`
  - Notes: the one fix: focus moved to the body when the clicked button disappeared (search ×, "Reset filters", "Clear filters"); it now returns to the search field. A scripted keyboard walk, target-size and contrast check found nothing else (lowest contrast: light footer text, 4.55:1).
  - Requirements: R6

- [x] **P5.4 — Responsive check against the design**
  - Goal: Compare the list page with `docs/design/list-desktop.png`, `list-mobile.png` and `states.png`, and fix deviations.
  - Depends on: P5.3
  - Files: the components touched by the findings; `app/assets/css/main.css` if a token is off
  - Tests: none new
  - Done when: at 320, 390, 768 and 1280 px there is no horizontal scroll; the filters wrap; the panel switches layout at its 520 px container width; picker labels fit at 320 px; the content column is `UContainer` at 960 px (`--ui-container`) with Nuxt UI's side padding; remaining deliberate differences from the prototype are listed in the step's `Notes:`.
  - Verify: browser device toolbar at the four widths in both themes, using `dev:fixtures`; build + smoke.
  - Out of scope: new features.
  - Commit: `fix(ui): responsive layout pass for list page`
  - Notes: deliberate differences from the prototype: side padding is Nuxt UI's container default (16/24/32 px instead of `clamp(16px, 4vw, 24px)`, 8 px more at ≥ 1024 px) rather than fighting its responsive classes; the sport select is always shown (owner decision, R4); the "League details" link comes with the league page (P6.4); the empty states are Nuxt UI `UEmpty` (centred).
  - Requirements: R6

**Checkpoint (Phase 5):** commits P5.1–P5.4 on `main`. The CI commands and `npm run test:e2e` pass locally. The local production build matches the list screenshots at 390 and 1280 px in both themes, with header and footer present, the freshness line visible after load and a clean console.

---

## Phase 6 — League page (last feature, cuttable)

If this phase is cut: mark its steps and P7.3 `[-]`, and in P8 adjust `README.md`, `CLAUDE.md`, `decisions.md` (§3.1 third route, §3.2, §3.4, §3.5, D9, D10), `design.md` (league page, its States rows, the "League details" link), `api.md` (third route, `LeagueDetails`) and the `strDescriptionEN` note in `requirements.md`.

- [x] **P6.1 — League details: adapter, cached function, route**
  - Goal: `GET /api/leagues/:id` returning `{ details, seasons }` from two upstream calls in parallel.
  - Depends on: P4.12
  - Files: `shared/types/league.ts`, `server/utils/sportsdb/normalise.ts`, `server/utils/cached.ts`, `server/api/leagues/[id]/index.get.ts`, `tests/fixtures/upstream/details/*.json` (real `lookupleague` captures for all 12 fixture leagues, taken once with pauses), `tests/fixtures/server.mjs`, `tests/unit/server/details.test.ts`, `tests/unit/server/routes.test.ts`
  - Tests:
    - details map to `LeagueDetails`;
    - the website gains `https://` and is `null` when empty;
    - the logo gets `/small` or is `null`;
    - the description keeps the first paragraph and loses `(… pronunciation: )` fragments, including the variant with trailing text;
    - `leagues: null` for a listed id → 502, not cached (a 404 for an unlisted id comes from the list check);
    - the route validates the id before any upstream call;
    - seasons come from the same cached function as the seasons route;
    - success sets `s-maxage=86400`; a failure → 502 without a cache header.
  - Done when: `LeagueDetails` matches `api.md`; the details function is cached for 24 h with an explicit `name`/`getKey`, taking `event` first; the two calls run with `Promise.all`; the fixture server answers `lookupleague.php` for all 12 fixture leagues and `{"leagues":null}` for unknown ids.
  - Verify: `dev:fixtures` and live `curl -i /api/leagues/4328`; `npm run test:coverage`.
  - Out of scope: any client code.
  - Commit: `feat(api): add league details route`
  - Requirements: R8, E1

- [x] **P6.2 — League details store**
  - Goal: Client-side data for the league page that reuses the badge cache.
  - Depends on: P6.1
  - Files: `app/stores/leagueDetails.ts`, `app/stores/seasonBadges.ts`, `tests/nuxt/stores/leagueDetails.test.ts`
  - Tests:
    - `load(id)` stores the details and seeds the badge cache with the returned seasons;
    - a repeat `load(id)` makes no request;
    - parallel loads share one request;
    - a 404 is recorded as `not-found`;
    - other failures are recorded as an error and evicted for retry;
    - opening the same league in the list afterwards makes no seasons request.
  - Done when: state is serialisable; the badge store exposes a small `seed(id, seasons)` action instead of having its state written from outside.
  - Verify: `npm run test:run`.
  - Out of scope: the page.
  - Commit: `feat(league-page): add league details store`
  - Requirements: R8, E1

- [x] **P6.3 — League page, hero, badge grid, SEO, 404**
  - Goal: The server-rendered `/leagues/[id]` from `design.md`, with a proper not-found page.
  - Depends on: P6.2
  - Files: `app/pages/leagues/[id].vue`, `app/components/LeagueHero.vue`, `app/components/SeasonBadgeGrid.vue`, `app/error.vue`, `tests/e2e/smoke.spec.ts`
  - Tests: smoke gains two cases — `/leagues/<fixture id>` renders the name, description and badge grid with a clean console; `/leagues/999999` and `/leagues/abc` answer HTTP 404 and show "League not found" with the "All leagues" link (the 404 document error is declared as expected in the console guard).
  - Done when:
    - the page loads through `await callOnce(\`league-${id}\`, …, { mode: 'navigation' })` (the data lives in the store, as on the list page);
    - a non-digit id matches no route (`definePageMeta({ path: '/leagues/:id(\\d+)' })`) and an unknown id throws a fatal `createError` 404; both show the 404 page;
    - other failures show an inline alert with "Try again";
    - the hero has the 112 px logo plate, name, chips (sport, country, "Founded …", "Season …") and an external website link with `rel`, a ≥ 44 px target and "(opens in a new tab)" for screen readers;
    - "About" is rendered as text (max 72ch, no `v-html`);
    - the grid is `repeat(auto-fill, minmax(104px, 1fr))` with captions and lazy images with sizes;
    - a league without badges shows the empty note;
    - `useSeoMeta` sets a dynamic title, description and `og:image`;
    - `error.vue` shows "League not found" for a 404 and a generic message in the same layout for any other status; it wraps itself in `UApp` and the layout (it replaces `app.vue`), and its "All leagues" button calls `clearError({ redirect: '/' })`.
  - Verify: build + smoke; view-source shows the description and meta tags; compare with `league-desktop.png` and `league-mobile.png`.
  - Out of scope: links from the list (P6.4).
  - Commit: `feat(league-page): add server-rendered league page`
  - Notes: `callOnce` instead of `useAsyncData`, as on the list page. Not `definePageMeta({ validate })`: it runs again in the browser while the 404 page hydrates and logs `NUXT_E1005`, which the smoke test's console guard caught; the route param regex (`:id(\\d+)`) gives the same 404 without that (phase review).
  - Requirements: R5, R6, E1

- [x] **P6.4 — Navigation between the list and the league page**
  - Goal: The "League details" link in the panel, a back link that restores the list state, and the loading bar.
  - Depends on: P6.3
  - Files: `app/components/SeasonBadgePanel.vue`, `app/components/LeagueDetailsLink.vue`, `app/pages/leagues/[id].vue`, `app/app.vue`
  - Tests: the panel test asserts one "League details" link in every panel state; the back navigation is checked in the browser here and by e2e in P7.3.
  - Done when: the panel shows "League details" as a `NuxtLink` in all panel states, including "no badges"; "All leagues" calls `router.back()` when the previous history entry is the list (read on the client from the router's history state), otherwise navigates to `/`; `NuxtLoadingIndicator` is mounted; the first visit shows the bar and a repeat visit is instant with no request; the bar does not show on query-only URL writes (filters, accordion; verify); while the league page loads, the list under the bar keeps its filters and open row, and no pending write lands on the league page URL.
  - Verify: `dev:fixtures` — filter, open a league, go to details, back: filters and the open row are restored. Open a league URL directly, then "All leagues" → `/`. Build + smoke.
  - Out of scope: e2e flows (P7.3).
  - Commit: `feat(league-page): link list and league page`
  - Notes: no `isListPath` util: "All leagues" asks `router.resolve(history.state.back).name === 'index'` (phase review). The panel's link is one `LeagueDetailsLink` component used in both layouts; `icon.clientBundle.scan` ships every template icon, so navigation fetches no icons at runtime.
  - Requirements: R5, R6, E1

**Checkpoint (Phase 6):** one commit for P6.1–P6.4 on `dev`. The CI commands and `npm run test:e2e` pass locally. On the local production build: `/leagues/4328` is server-rendered with logo, chips, description and badges; `/leagues/999999` and `/leagues/abc` are 404 pages; list → details → back restores the filters; the footer freshness line is absent on a directly opened league page.

---

## Phase 7 — E2E suite and the README screenshot (cuttable)

If this phase is cut: mark its steps `[-]`, and in P8 adjust `decisions.md` §4, §5 (the E2E job becoming required), D1 and D2, the R4 note in `requirements.md` (e2e and the README screenshot) and the README top section. All specs run against the production build with the fixture server. No test may depend on test order or on the server cache left by another test.

- [x] **P7.1 — E2E: search and sport filter**
  - Goal: Prove R3 and R4 in a real browser on mixed-sport data.
  - Depends on: P4.12
  - Files: `tests/e2e/filters.spec.ts`, `tests/e2e/helpers.ts`
  - Tests:
    - typing filters the list, updates the count and highlights the match, and `?q=` appears after the debounce;
    - a query with different case and an accent still matches;
    - the sport dropdown is visible with counts, and choosing a sport filters and sets `?sport=`;
    - choosing "All sports" removes `?sport=`;
    - reset clears both;
    - no results shows the empty state naming the query;
    - reload with params reproduces the screen;
    - `?sport=Nope` shows the full list without an error.
  - Done when: every spec uses the console guard from P4.5; selectors use roles and labels.
  - Verify: `npm run build && npm run test:e2e`.
  - Out of scope: production code changes (a failing flow is reported and fixed as its own `fix` commit).
  - Commit: `test(e2e): cover search and sport filter`
  - Notes: every spec opens pages through `visit()` (from the phase review): `page.goto` plus a wait for Nuxt's hydration, so a first click or keystroke is never lost on a slow runner. URLs are asserted with `toHaveURL`.
  - Requirements: R3, R4

- [x] **P7.2 — E2E: accordion, season switch, cached reopen, error and retry**
  - Goal: Prove R7 and R8 as the user sees them.
  - Depends on: P7.1
  - Files: `tests/e2e/badges.spec.ts`
  - Tests:
    - open a league → badge visible and `?open=` set;
    - open another → the first closes;
    - switch season → the image and `?season=` change;
    - close and reopen → **zero** new browser requests to `/api/leagues/*/seasons` (counted with a request listener);
    - the no-badges league shows the empty note;
    - with `page.route` answering one league's seasons request with 10 seasons inside the test (no fixture file), the stepper shows and stepping works;
    - with `page.route` failing the seasons request (its console error declared as expected), the error alert shows, and after un-routing "Try again" loads the badge (the failure was not cached);
    - filtering away the open league drops `open` and `season`.
  - Done when: the request counting does not rely on which leagues earlier tests opened (each test uses its own league id, or asserts only on requests made after its own first open).
  - Verify: `npm run build && npm run test:e2e`, twice in a row and with `--repeat-each=2`.
  - Out of scope: 1015 mapping (unit tests, P3.2).
  - Commit: `test(e2e): cover season badges, caching and retry`
  - Notes: the cached-reopen test records requests from before the first open and expects exactly one, so an empty list cannot pass for the wrong reason (phase review).
  - Requirements: R7, R8

- [x] **P7.3 — E2E: league page and back (skip if Phase 6 was cut)**
  - Goal: Prove the list ↔ league page round trip.
  - Depends on: P7.2, P6.4
  - Files: `tests/e2e/league-page.spec.ts`
  - Tests:
    - filter + open + "League details" → the page shows the name, description and grid;
    - "All leagues" returns with filters and the open row restored;
    - a direct visit then "All leagues" → a clean `/`;
    - opening in the list a league already seen on its page makes no seasons request;
    - an unknown id shows the not-found page with status 404;
    - with the details request delayed through `page.route`, the list under the loading bar keeps its filters and open row, and the league page URL never gains `q`.
  - Done when: the flows pass on mobile (390 px) and desktop viewport sizes within the single project.
  - Verify: `npm run build && npm run test:e2e`.
  - Out of scope: SEO tag assertions beyond the title.
  - Commit: `test(e2e): cover league page navigation`
  - Notes: the delayed details request is held by `Promise.withResolvers` (no timer), and the test asserts the new URL while the request is held, so the kept list is proved during loading (phase review). The unknown-id 404 is covered by the smoke test, not repeated here. Writing it found server-log noise: a fatal 404 thrown during SSR is logged as a server error by Nitro, so the page's 404 is fatal only in the browser.
  - Requirements: R5, E1

- [x] **P7.4 — Sport-filter screenshot and README top section**
  - Goal: Show the sport dropdown to a reviewer who only reads the README (D1).
  - Depends on: P7.1
  - Files: `tests/e2e/screenshot.spec.ts`, `docs/readme/sport-filter.png`, `package.json`, `README.md`, `playwright.config.ts`, `CLAUDE.md` (commands block gains `screenshot`)
  - Tests: none (the spec is a capture, excluded from `test:e2e` by a tag)
  - Done when: `npm run screenshot` captures the list on mixed fixtures with the sport dropdown open at a fixed viewport, in the dark theme, to `docs/readme/sport-filter.png`; the README opens with that image, one sentence on why the dropdown is disabled on live data, and `npm run dev:fixtures`; the capture is not part of CI (no diff churn).
  - Verify: run `npm run screenshot` and view the image; the README renders it in a Markdown preview.
  - Out of scope: the rest of the README (P8.1).
  - Commit: `docs(readme): add sport filter screenshot`
  - Notes: the spec is tagged `@screenshot` and excluded from every run unless `README_SCREENSHOT` is set, which `npm run screenshot` does; Playwright's `animations: 'disabled'` keeps the open menu from being captured mid-fade.
  - Requirements: R4, R12

**Checkpoint (Phase 7):** one commit for P7.1–P7.4 on `dev`. `npm run test:e2e` is green twice in a row (stability). The README shows the screenshot in a Markdown preview. Making `E2E` a required check happens in P8.6.

---

## Phase 8 — Delivery

Always runs; it describes what was actually built. P8.1–P8.3 are local commits; P8.4–P8.7 publish them: the first push, CI, hosting, the ruleset and the release, all with the owner's hands or on the owner's command.

- [ ] **P8.1 — README**
  - Goal: A reviewer can understand, run and verify the project from the README alone.
  - Depends on: P4.12 (plus whichever of P5–P7 were done)
  - Files: `README.md`
  - Tests: none
  - Done when: it contains what it is; the live link (added in P8.5, once the URL exists); the sport-filter screenshot and `npm run dev:fixtures` at the top (if P7.4 was done, otherwise the command and a sentence); requirements (Node version); how to run (dev, build + preview, tests); a scripts table matching `package.json`; a short architecture paragraph; a link to `docs/`. A fresh clone followed by the README's commands works.
  - Verify: follow the README in a fresh clone in a temporary directory: `npm ci`, `npm run build`, `npm run test:run`, `npm run dev`.
  - Out of scope: the long-form docs.
  - Commit: `docs(readme): complete run and verification guide`
  - Requirements: R10, R11, R12

- [ ] **P8.2 — Cache warm-up script**
  - Goal: A command that warms every league after a deploy without tripping the upstream rate limit.
  - Depends on: P3.6
  - Files: `scripts/warm-cache.mjs`, `package.json`, `README.md`, `CLAUDE.md` (commands block gains `warm`)
  - Tests: none (a thin script; verified against the fixture-backed build)
  - Done when: `npm run warm -- <base-url>` fetches `/api/leagues`, then for each league the seasons route and (if Phase 6 exists) the details route, **sequentially with a pause of at least 2 s** between upstream-bound calls; it stops at the first non-2xx response with a clear message; it prints one line per league and a summary; the README mentions it under "Deploy".
  - Verify: run it against the local production build with the fixture server; the fixture log shows each upstream URL exactly once, and a second run shows none.
  - Out of scope: running it automatically from CI or a deploy hook.
  - Commit: `chore(deploy): add cache warm-up script`
  - Requirements: R8, R11

- [ ] **P8.3 — Final review and docs sync**
  - Goal: One full-scope pass before sharing the link.
  - Depends on: P8.1, P8.2
  - Files: whatever the review finds; `CLAUDE.md`, `docs/*.md` for drift
  - Tests: none new unless a finding needs one
  - Done when: the `review` skill with `--scope=all` (every tracked file) against checklist groups A–L is clean; the `CLAUDE.md` commands and architecture match the code; `docs/decisions.md`, `api.md` and `design.md` match the behaviour; every `[x]` in this plan has its "Done when" met; `git grep` finds no secrets, no `console` outside `scripts/**` and `tests/fixtures/**`, no leftover TODO.
  - Verify: lint, typecheck, `test:coverage`, build, `test:e2e` all green locally (CI runs from P8.4).
  - Out of scope: new features; refactors not tied to a finding.
  - Commit: `chore: final review fixes and docs sync`
  - Requirements: R5, R11, R12, E1

- [x] **P8.4 — First push and CI (owner)**
  - Goal: The local history reaches a public repository and CI runs on it for the first time.
  - Depends on: P8.3
  - Files: none (git only)
  - Tests: none
  - Done when: the owner created the **public** GitHub repository (D6; rulesets on a free plan need a public repo), empty (no README, `.gitignore` or licence); on the owner's command `origin` was added and `main` pushed; the run of "Lint, Typecheck, Test, Build" and the `E2E` job on `main` are green. If a run is red (for example a Linux-only issue), the fix is a new commit (`fix(ci): …`) pushed on the owner's command; history is never rewritten after the push.
  - Verify: the Actions tab shows both jobs green on the last commit of `main`.
  - Out of scope: hosting (P8.5), the ruleset (P8.6).
  - Commit: none (a fix commit only if CI is red)
  - Notes: done early, right after Phase 5, by a deploy agent on the owner's request: https://github.com/exibet/sports-league, both CI jobs green on the first run.
  - Requirements: R10, R11

- [~] **P8.5 — Connect Vercel and add the live link (owner)**
  - Goal: Production deploys from `main`, and the README links to it.
  - Depends on: P8.4
  - Files: `README.md` (the live link)
  - Tests: none
  - Done when: the owner imported the repository with the Nuxt preset auto-detected; Node 24.x is selected (the build log shows the version actually used, since `engines.node` can override the dashboard; if it is not 24.x, align the dashboard setting and record it in `decisions.md` §2); no env vars are needed (the key defaults to the free one; set `NUXT_SPORTSDB_API_KEY` only if a paid key is used); the production URL serves the app; the README's live link is committed and pushed on the owner's command (before P8.6 makes `main` PR-only); on production, success responses of `/api/**` carry `Cache-Control`.
  - Verify: open the production URL; a repeat `curl -sI <production-url>/api/leagues` shows `x-vercel-cache: HIT` (Vercel strips `s-maxage` from the response it serves).
  - Out of scope: the warm-up and the final checks (P8.7).
  - Commit: `docs(readme): add live link`
  - Notes: done early (after Phase 5) except the README link: Vercel project `sports-league`, Git integration, production from `main` at https://sports-league-sooty.vercel.app (the plain name was taken). The ruleset came first, so the README link goes through a `dev` → `main` PR. Vercel's CDN consumes `s-maxage`/`stale-while-revalidate` and strips them from the response, so the check is a repeat request with `x-vercel-cache: HIT`, not the header. The first build used Node 26.x because `engines.node` ended with `>=26`; the range now stops at 24, so the next production build (the first `dev` → `main` merge) uses the project's 24.x.
  - Requirements: R8, R11

- [x] **P8.6 — Enable the `main` ruleset (owner, GitHub settings)**
  - Goal: Protect `main` as D13 describes, now that the required checks have run and can be selected.
  - Depends on: P8.5
  - Files: none
  - Tests: none
  - Done when: the ruleset targets `main` with deletion and force-push blocked, linear history required, pull request required with **0 required approvals** (a solo owner cannot approve their own PR), allowed merge methods rebase and squash, and required status checks "Lint, Typecheck, Test, Build" and `E2E` (`E2E` only if Phase 7 was done; otherwise it stays optional).
  - Verify: a direct `git push` to `main` of an empty test commit is rejected (then dropped locally).
  - Out of scope: any code change.
  - Commit: none
  - Notes: done early with P8.4 (ruleset `main`, active): `E2E` runs but is not required yet; GitHub also added its default extra-approval setting for unattributed changes, which does nothing with 0 required approvals.
  - Requirements: R10

- [ ] **P8.7 — Release (owner)**
  - Goal: The link that gets submitted works on first click.
  - Depends on: P8.6
  - Files: none
  - Tests: none
  - Done when: the production deploy of the last commit on `main` is green; `npm run warm -- <production-url>` completed; the production URL was checked on a phone and a desktop in both themes (list, search, badge, league page if built, 404); the repository is public with a description, topics and the live URL in "About"; the README's live link is correct; the repository link is ready to submit.
  - Verify: open the repository and the live URL in a private window, not logged in.
  - Out of scope: anything after submission.
  - Commit: none (performed after the last push, so this step stays `[ ]` in the repository)
  - Requirements: R10, R11

**Checkpoint (Phase 8):** P8.1–P8.3 committed locally and checked; after P8.4–P8.6 both CI jobs are green on GitHub, production serves the app and `main` is protected; the owner performs P8.7.

---

## Risks and open questions

1. **Dev cache can mix live and fixture data.** Nitro persists the dev cache to disk under the same keys, so `npm run dev` followed by `npm run dev:fixtures` could show live data without the dropdown. Recommended: in-memory `nitro.devStorage` for the cache (P3.5). If that option misbehaves, add a source tag derived from the base URL to every `getKey`.
2. **Testing Nitro handlers in the `node` project.** Handlers and cached functions rely on auto-imports, and the coverage `include` is `server/**`. Recommended: keep handlers thin, import `h3` helpers and the project's own `server/utils` explicitly, and replace only `defineCachedFunction` and `useRuntimeConfig` in one test helper (P3.5). If stubbing proves brittle, stop and discuss — do not narrow `include` or lower thresholds.
3. **Rate limit and one shared egress.** About ten rapid upstream calls trigger a block of unknown length, and the warm-up alone makes 20+. Recommended: sequential warm-up with a pause, stop on the first 502, warm once per deploy, and never run e2e or unit tests against the live API. The in-memory cache is per instance, so warm-up mainly benefits the CDN layer and the instance it hits.
4. **Ruleset preconditions.** The repo must be public (on a free plan), required approvals must be 0, and the required check can only be selected after CI has run once. Recommended: follow the P8.4 → P8.5 → P8.6 order exactly (the live-link commit is pushed before `main` becomes PR-only).
5. **Version drift at install time.** The versions in `decisions.md` §2 were fixed during research. If `npm install` reports a peer conflict, stop and record the resolved version in `decisions.md`; do not use `--legacy-peer-deps` or unpin TypeScript.
6. **Production builds report hydration mismatches tersely.** The smoke test can only see a generic console error. Recommended: match `/hydration/i`, and when it fires, reproduce in `npm run dev:fixtures`, where the full warning is printed.
7. **Preview URLs may require a login.** The hosting provider protects preview deployments by default. Recommended: leave it on, and share only the production URL with reviewers.
