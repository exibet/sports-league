# Review checklist

Walk every group; report only real violations in the diff.

## A. Project rules (`CLAUDE.md`)

- Upstream field names (`strLeague`, `idLeague`, `strBadge`, …) outside the server adapter and its
  tests. 🔴
- A component calling `$fetch`/`useFetch`, or anything building upstream URLs outside the server
  adapter. 🔴 (Pages and components calling store actions is the intended pattern.)
- The API key or upstream base URL reachable from client code (public runtime config, a client
  import of server utils). 🔴
- `any`, or an `as` cast that is not at the upstream trust boundary with a comment.
- A hardcoded color, radius or font in a component instead of a Nuxt UI token / CSS variable (the
  badge-plate token is the only exception).
- A type duplicated instead of imported from `shared/types`.
- An icon loaded from the runtime Iconify API instead of a local collection.
- Docs drift: a decision changed in code while `docs/decisions.md`, `api.md` or `design.md`
  still says the old thing.

## B. State and URL sync (decision D4)

- `useRoute()` inside a Pinia store (stale route after navigation) — use
  `useRouter().currentRoute`. 🔴
- List state (`q`, `sport`, `open`, `season`) copied into store state instead of derived from the
  route. 🔴 Exception: the debounced search draft in `LeagueFilters`.
- `router.replace` called during store setup or SSR, or to "fix" invalid params on load. 🔴
- `router.push` for filter/accordion changes (floods history) — use `replace`.
- Invalid params (unknown sport, unknown id, unknown season, array values) not handled by
  derivation; anything that throws on a bad URL.
- `open(id)` not clearing `season`; a filter change that hides the open league not dropping
  `open`/`season`.
- In-flight promises in module scope (leak across SSR requests) or in returned store state
  (breaks payload serialisation). 🔴
- Store logic that cannot be tested against the test environment's memory-history router.

## C. Caching and data flow (R8)

- An upstream call not wrapped in `defineCachedFunction`, or missing an explicit `name`/`getKey`,
  or not receiving `event` as its first argument.
- An error, `null` or the upstream error string cached as a value; 1015/non-JSON detected after
  normalisation (turns an error into a cached `[]`). 🔴
- Cache key that ignores the league id. 🔴
- Upstream fetch without a timeout or with retries enabled.
- `Cache-Control` set on error responses (e.g. via `routeRules`), or missing `max-age` (browser)
  or `s-maxage` (CDN) on success.
- Client badge cache: a repeat open firing a request, two parallel opens firing two requests, a
  failure left cached so "Try again" cannot retry.
- Data fetched in a `watch` or only in `onMounted` that SSR should have awaited (`callOnce`,
  `onServerPrefetch` or `useAsyncData`); the list refetched on the client after SSR.

## D. Server adapter and errors

- `:id` not validated (digits, present in the cached league list) before the upstream call. 🔴
- Upstream edge cases not normalised: `seasons: null`, `"Invalid League ID passed"`, null badges,
  `leagues: null`, 429, `error code: 1015`, timeout (see `docs/api.md`).
- Error responses leaking upstream internals or the API key.

## E. Nuxt and SSR

- `window`, `document`, `localStorage`, `navigator` outside `onMounted` / `import.meta.client`. 🔴
- Hydration mismatch: `Date.now()`, relative time, random values, locale formatting or the theme
  icon in the server render. 🔴
- A composable called after an `await` in setup (Nuxt context lost).
- `useAsyncData` key not unique to its params, a reactive key that re-fires unintentionally, or the
  deprecated `pending` read instead of `status`.
- League page: missing 404 for an unknown id, missing or static `useSeoMeta`, "All leagues" not
  using `router.back()` when coming from the list.
- External links without `rel="noopener noreferrer"`; internal navigation not through `NuxtLink`.

## F. Product logic

- Search not case-, whitespace- and diacritics-insensitive; highlight misaligned with the match.
- Sport dropdown hidden, or enabled with a single sport (it is always shown, disabled with a note
  then), or options hardcoded instead of derived.
- Empty, loading and error states missing or not matching `docs/design.md`.
- `SeasonPicker` not switching modes above 5 seasons; "no badges" not handled.
- More than one accordion row open at a time.

## G. SOLID / DRY / KISS and simplification

- Code that reads like a machine wrote it: repeated or no-op guards ("if undefined, return it"),
  defensive checks of what the types already guarantee, validation repeated past the trust
  boundary. One check at the boundary is enough.
- A `for`/`while` loop where `map`/`filter`/`flatMap`/`reduce`/`find`/`some` reads better.
- A hand-written helper (debounce, timer, listener, storage, media query) that VueUse already has.
- A component that fetches, transforms and renders — move data access to a store/composable.
- A `ref` mirrored by a `watch` where a `computed` works; derivable state stored.
- An abstraction with one caller, a wrapper that only forwards, an option nobody passes.
- Copy-paste between the list panel and the league page that wants one component.
- Dead code: exports with no users (grep first), unused props, orphaned comments.
- A name that lies about its content; a condition that needs a truth table — name it.
- A change unrelated to the current plan step riding along.

## H. Security

- Secrets or `.env` committed. 🔴
- `v-html` with API text (descriptions) — render as text. 🔴
- Unvalidated input reaching an upstream URL. 🔴

## I. Performance

- A request per list item; independent requests awaited sequentially instead of `Promise.all`.
- Work in the template (filter/map/format) instead of a `computed`; `v-for` without a stable key.
- Images without the `/small` variant, explicit size or `loading="lazy"` below the fold.
- Heavy imports on the list page that only the league page needs.

## J. Accessibility

♿ by default, 🔴 when a control is unusable.

- Touch targets under 44 px; icon-only controls without `aria-label`.
- Accordion header not a `<button aria-expanded aria-controls>`; season picker not a radio group
  (tabs without panels are wrong).
- Result count not announced (`aria-live`); focus lost after closing a panel or navigating back.
- Text contrast below 4.5:1 in either theme.

## K. Tests

- New logic without a unit test (adapter, normalisation, filters, store actions).
- Tests hitting the live API instead of fixtures. 🔴
- E2E depending on test order or on the server cache from a previous test.
- Assertions on implementation details instead of behaviour; snapshot-only tests.
- Coverage thresholds lowered or `include` narrowed to make a check pass. 🔴

## L. AI tooling (`.claude/**`, `CLAUDE.md`, `docs/plan.md` diffs only)

- A rule changed in one place while its copy elsewhere is left stale.
- A pointer to a file, script or section that does not exist.
- A plan step ticked without its "Done when" and "Verify" items met.
