# How it was built

The story behind the code: the stages from the assignment to production, what each stage decided,
what reviews and tests caught along the way, and how AI tools were used (R12). The details live in
the other files of `docs/`; this page connects them.

## 1. Requirements

The assignment is kept word for word in [`requirements.md`](./requirements.md) and split into
thirteen requirements (R1–R13) plus what the reviewers grade (E1: components, state, API
integration, product logic). The ambiguous parts were interpreted in writing before any code:

- **"SPA" and Nuxt.** A Nuxt universal app: the first request is rendered on the server, and
  everything after hydration runs as an SPA. Server rendering keeps the API key secret and lets one
  server cache serve every visitor.
- **"If multiple sport types appear" (R4).** The free key returns one sport, so a dropdown shown
  only for several sports would never appear. It is always shown, disabled with a note on live
  data, and proven on fixtures with several sports.
- **"callstrDescriptionEN" (R8).** Read as a hint to show the league description, which led to the
  league page.
- **90 minutes (R13).** The scope is deliberately larger (a server layer, a league page, tests), so
  the core brief R1–R8 was planned first and every extra phase could be cut.

## 2. The real API

Before any design, the API was called with the free key and its real answers were written down in
[`api.md`](./api.md). These findings shaped the app:

| Observed | What the app does about it |
|---|---|
| 10 leagues, all Soccer | The sport filter stays visible but disabled; fixtures add NBA and Formula 1; `npm run dev:fixtures` and the README screenshot show the filter working |
| The five oldest seasons per league; for some leagues every badge is `null` | The panel opens on the first season with a badge and a picker switches seasons; "no badges" is a designed state |
| A bad id answers HTTP 200 with an error string; an unknown id answers `null` | The server checks an id (digits, present in the cached list) before any upstream call; unknown ids get a 404 |
| About ten quick requests get a Cloudflare HTTP 429 with a plain-text `error code: 1015`, for minutes | Failures are detected before the data is read and never cached; concurrent requests for the same data share one call; the warm-up script waits 9 s between requests |
| Descriptions carry leftover fragments such as `(Italian pronunciation: )`; websites come without a scheme | The adapter cleans the description and normalises the URL |
| Images come from a separate CDN that the rate limit does not touch | Badges and logos load straight from it, in the `/small` size |

## 3. Idea, stack and architecture

The idea: keep the brief's small screen, but build it the way a production Nuxt app would be built
— a fast server-rendered list, filters you can share as a link, and upstream data cached so it is
not fetched twice. [`decisions.md`](./decisions.md) records the stack (§2), the architecture (§3),
testing (§4), tooling (§5) and fourteen decisions, D1–D14 (§7). The main choices:

- **Nuxt 4**, because the company is moving to Nuxt, with **Nuxt UI** (the Nuxt team's own kit:
  accessible Reka UI primitives, dark mode, color tokens) rather than shadcn-vue (dozens of copied
  files in the repository) or PrimeVue (heavy, a corporate look).
- **The app's own server layer (Nitro):** three `/api` routes, one adapter for TheSportsDB, and
  cached functions with a lifetime per kind of data (list 30 minutes, details a day, seasons a
  week).
- **The URL as state:** search, sport, the open league and the season live in the query string;
  Pinia stores read and write it and hold the fetched data. Reload, share or go back, and the
  screen is the same.
- **Tests on fixtures, never on the live API:** the server layer and the stores first, components
  where behaviour matters, Playwright on the production build.
- **TypeScript pinned to 6.0:** TypeScript 7 breaks `@typescript-eslint`.

Before any code, an independent reviewer read these documents; its findings and the owner's answers
were folded back in.

## 4. Design

The prototype was built in Claude Design on real API data: the ten leagues with their real badges
and logos, plus NBA and Formula 1 for the mixed-sport view. Its boards (the list and the league
page at 390 and 1280 px, and every state: loading, empty, errors, no badges, more than five seasons)
are in [`design/`](./design/). [`design.md`](./design.md) turns them into a spec: Nuxt UI tokens
(slate and green), dark by default, 44 px touch targets, the season picker as a radio group, layouts
from 320 px up.

## 5. The plan

[`plan.md`](./plan.md) breaks the work into eight phases. Each step has a goal, its files, the tests
to write first, "Done when", a check to run, what is out of scope and its commit message. Phases 2–4
deliver the whole core brief, Phases 5–7 could each be cut, and Phase 8 (delivery) always runs.

Two project skills execute it: `phase` takes one step (tests first, implement, verify, review,
tick, propose a commit, stop), and `review` runs every check, walks
[the checklist](../.claude/skills/review/checklist.md) and has an independent reviewer read the
changes.

## 6. Implementation

| Phase | What it delivered | Commit |
|---|---|---|
| 1 | Requirements, API research, stack, design, decisions, plan | `docs/`, committed with Phase 2 |
| 2 | Nuxt app, Nuxt UI, Pinia, ESLint, a typecheck that covers the tests, Vitest projects, git hooks, CI | `19ff490` |
| 3 | Server layer: upstream client with error detection, normalisation, id checks, cached routes, fixture server | `8e13b65` |
| 4 | List page: search, sport filter, URL sync, accordion with season badges, smoke test. **Core brief R1–R8 complete** | `ff5aee5` |
| 5 | Header with theme toggle, footer with data freshness, keyboard, focus and touch-target pass, responsive pass | `5271553` |
| 6 | League page `/leagues/:id`, rendered on the server and linked from the list | `fd3afd6` (PR #1) |
| 7 | E2E suite for filters, badges, caching and the league page; the README screenshot | `485e675` (PR #2) |
| 8 | README, cache warm-up script, a final review of the whole repository, CI split into one job per concern, this page | the Phase 8 PR |

A phase ran like this. Its steps piled up in the working tree, each one tests first, then the code,
then lint, typecheck and unit tests (from Phase 4 on, also the production build and the smoke test)
and a quick review. At the end of the phase came the full review with an independent reviewer. The
owner then looked at the whole phase in the running app and in the diff, asked for changes, and only
then gave the command to commit: one commit per phase, its body listing the steps.

## 7. What reviews and tests caught

These changed the code, so they are worth knowing about.

**The owner's product and design review**

- **The sport filter must always be there.** At first it was hidden when the data had a single
  sport. The owner asked for it to be always visible, so it is now disabled with a note on live
  data.
- **Two clear buttons in the search box** (the browser's own and Nuxt UI's): now there is one.
- **The footer had no rhythm.** Its columns were realigned, with the date moved to the end.
- **The footer fell below the fold.** Nuxt UI's `UMain` is a full screen tall, so on a short page it
  pushed the footer off screen. The layout is now a full-height flex column, and an e2e test checks
  that the footer is in view.
- **List cache: 30 minutes instead of 4 hours**, so a change upstream shows up sooner.

**The owner's code review**

- **"Written like a machine."** The owner asked for code that reads like a person wrote it:
  - `for` and `while` loops became `map`, `filter` and `reduce`;
  - repeated guards went (validate once at the trust boundary, then trust the types);
  - hand-written timers gave way to VueUse (`useDebounceFn`, `useTimeAgo`).

  The rules went into `CLAUDE.md` and the review checklist, so later phases were written that way
  from the start.

**Independent reviews and tests**

- **A missing league cached as a 404 for a day.** A details payload with `leagues: null` would have
  been stored for 24 hours. It is now an upstream failure (502), which is never cached and is
  retried on the next request.
- **An invalid website crashed the server render.** `new URL()` threw on an upstream value that is
  not a URL; the adapter now checks it with `URL.canParse` and drops it.
- **The league page's 404.** A `validate` hook produced Nuxt warnings (`NUXT_E1005`). The route now
  matches digits only (`/leagues/:id(\d+)`), and the error is fatal only on the client, so the
  server does not log an ordinary 404 as a crash.
- **An automatic retry after a failed server render.** The final review found that when a
  league's seasons failed during SSR (a shared `?open=` link), the badge panel asked again right
  after hydration: two upstream calls within a second, under a rate limit. Now only "Try again"
  retries, and a component test pins it.
- **A test that passed without the behaviour.** The e2e test "while the league page loads, the list
  keeps its state" passed even when the list did not keep it. It now holds the details request and
  checks the page while the request is pending.

**Delivery**

- **Node 26 on Vercel.** `engines.node` ended with `>=26`, so Vercel built on the newest major
  despite the project's 24.x setting; the range now stops at 24.
- **Vercel strips `s-maxage`.** The CDN consumes the header, so it never reaches the browser. The
  check became a repeat request that answers `x-vercel-cache: HIT`.

## 8. Repository, CI/CD and deploy

After Phase 5 the core brief was complete and polished. The owner had `main` published early, so
that CI and the live site were in place for the remaining phases:

- a public GitHub repository, with `main` pushed and both CI jobs green on the first run;
- a Vercel project through the Git integration (no environment variables needed), with production
  at https://sports-league-sooty.vercel.app;
- a ruleset on `main`: pull requests only, linear history, no force-push or deletion, the "Lint,
  Typecheck, Test, Build" check required.

From Phase 6 on, each phase was one commit on `dev`, pushed and opened as a pull request on the
owner's command. The owner rebase-merged it, Vercel deployed production, and `dev` was reset to
`origin/main`, so both branches stay identical.

In Phase 8 the owner asked for a cleaner pipeline. The first CI had one job doing everything in a
row, plus an E2E job that built the app a second time. It became one job per concern:

- Lint, Typecheck and Unit tests run in parallel, so a failure shows up by name and early;
- Build starts only when all three pass and uploads `.output` as an artifact;
- E2E runs on that artifact: what is tested is exactly what was built, and nothing is built twice;
- Audit reports advisories without blocking;
- a gate job, under the name the ruleset already required, passes only when Lint, Typecheck, Unit
  tests and Build did. The ruleset did not have to change, and later job changes will not touch it.

The jobs and their commands are in the [README](../README.md#cicd).

## 9. Verification

- **Every step:** lint, typecheck and unit tests; from Phase 4 on, also the production build and
  the smoke test (no console errors, no hydration warnings).
- **Every phase checkpoint:** the CI commands in CI order, plus the checks the plan lists for that
  phase, on the production build. For Phase 4, for example:
  - ten leagues rendered on the server;
  - reopening a league makes no request;
  - a reload with `?q=&open=&season=` brings back the same screen;
  - the console is clean;
  - there is no horizontal scroll at 390 px.
- **Tests:** 260 Vitest tests (173 for the server layer and the utilities, 87 for the stores,
  components and pages) and 32 Playwright tests, all on fixtures. The coverage thresholds are 70% for lines
  and functions and 65% for branches.
- **The README:** followed in a fresh clone (`npm ci`, `build`, `test:run`, `dev`).
- **The warm-up script:** run against the production build on fixtures, the first pass called every
  upstream URL once and the second pass none.
- **Production:** API responses are served from the CDN (`x-vercel-cache: HIT`). Before submission
  the site is warmed and checked on a phone and a desktop in both themes (plan step P8.7).

## 10. AI tools (R12)

- **Claude Code** wrote the docs, the code and the tests together with the owner. It followed
  [`CLAUDE.md`](../CLAUDE.md) (commands, architecture, code rules) and two skills,
  [`phase`](../.claude/skills/phase/SKILL.md) and [`review`](../.claude/skills/review/SKILL.md).
  All of it is published on purpose.
- **Claude Design** produced the prototype behind [`design.md`](./design.md).
- **Independent reviewer agents**, each with a fresh context, read the docs before any code and
  every phase before its commit. Each finding was checked against the installed packages and the
  tests before anything changed; what did not hold was dropped.
- **The owner** made the product and design decisions, reviewed every phase in the running app and
  in the diff, gave every git command, merged the pull requests and did the GitHub and Vercel
  account steps.

## What's next

Ideas that are out of scope for now are listed in
[`decisions.md` §8](./decisions.md#8-out-of-scope-next-steps).
