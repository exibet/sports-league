---
name: review
description: Review changes in this repo before they are committed — runs lint, types, unit tests, build and e2e, walks the project checklist (readability and the owner's code style, library-first, state and URL sync, caching, server adapter, SSR, product logic, security, performance, accessibility, tests) and has an independent reviewer agent read the diff (Opus at xhigh effort by default, Fable only when the owner asks for it). Use when the user asks for a review or to check changes, runs /review, or when the phase skill reaches its review step.
---

# Review

Reports problems; never edits code during the review. Fixes happen only when the user (or the
`phase` skill) asks.

## Arguments

- `--scope=working` | default | `--scope=all` — see Scope.
- `--no-checks` — skip step 2 (the caller has just run them).
- `--no-agent` — skip step 5 (quick intermediate reviews inside a phase). The review before a
  phase commit always runs the agent.
- `--fable` — run the step 5 reviewer on Fable. Use it only when the owner asked for Fable in
  chat ("check it with Fable" and the like); never by default.

## Scope

- `--scope=working` (used by `phase`): only uncommitted changes — `git diff HEAD` plus untracked
  files from `git status --porcelain` (read them whole).
- Default: everything not yet on `main` — `git diff origin/main` plus uncommitted and untracked
  files.
- `--scope=all`: every tracked file (`git ls-files`), read whole.

## Steps

1. **Collect the diff** for the scope above.
2. **Run the checks**, unless called with `--no-checks`: `npm run lint:check`, `npm run typecheck`,
   `npm run test:run`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`. Record
   failures verbatim.
3. **Read the context** the diff needs: `CLAUDE.md` (especially "Code rules"), the relevant parts
   of `docs/decisions.md`, `docs/api.md`, `docs/design.md`, and the plan step in progress
   (`docs/plan.md`).
4. **Walk `checklist.md`** — every group, group G (the owner's code style) and group K (test
   quality) with the most care. Report only what the diff actually violates; quote the line.
   Grep before claiming dead code or a missing usage.
5. **Independent reviewer** (unless `--no-agent`). Spawn one subagent with the brief below, in
   the background, and keep working until it reports:
   - model `opus` with effort `xhigh` by default; model `fable` (no effort override) only with
     `--fable`;
   - tell it not to edit files, not to change git state, and not to run `build` or Playwright
     (their ports may be busy).

   When it reports, **verify every finding** before it reaches the owner: check each "the library
   already does this" claim against the installed package in `node_modules` and try the
   replacement (typecheck, the affected tests). Drop what does not hold and say why. Agree,
   disagree or "owner's call" for each item. The agent's text is input, not a verdict.
6. **Check the step's "Done when" and "Verify"** items from `docs/plan.md` if a step is in
   progress: met, not met, or not verifiable — say which.
7. **Report** (in the owner's language):

   ```
   ## Review — <step id or scope>
   Checks: lint ✅/❌ · types ✅/❌ · tests ✅/❌ (n) · coverage ✅/❌ · build ✅/❌ · e2e ✅/❌ (n)
   Reviewer: opus xhigh | fable | — (skipped)

   ### 🔴 Must fix
   - file:line — problem → consequence → fix (before/after code for readability items)
   ### 🧰 Library-first (reinvented wheels)
   - file:line — what we wrote → the existing API (package, where verified) → replacement
   ### 🔧 Should fix (readability, simplicity, project rules)
   ### ⚡ Performance
   ### ♿ Accessibility
   ### 🧪 Tests (vacuous assertions, isolation, flakiness)
   ### 💬 Nits / questions
   ### ❎ Not taken — reviewer items dropped, and why
   ### ✅ Done-when criteria
   Verdict: ⛔ Not ready — must fix | ❓ Needs discussion | ✅ Ready with suggestions | ✅ Ready
   ```

   Empty sections are omitted. The verdict is ⛔ when any check failed or any 🔴 exists.

## Reviewer brief (step 5)

Fill in the scope and the step, then send it as the agent's prompt:

> You are an independent reviewer of `<scope>` in the Nuxt 4 project at `<repo path>` (versions in
> `package.json`). Do NOT edit files or change git state; do not run `build` or Playwright; you may
> run `npm run lint:check`, `npm run typecheck`, `npm run test:run`. Read every changed or new
> file whole, then `CLAUDE.md` ("Code rules"), `.claude/skills/review/checklist.md` and the plan
> step(s) in `docs/plan.md` with their `Notes:`.
>
> The owner's priorities: code that reads like a person wrote it — simple, obvious, short;
> validate once at the trust boundary, then trust the types; no repeated or no-op guards ("if it
> is undefined/empty/null, return it"); `map`/`filter`/`reduce` over `for`/`while`; no
> hand-written timers or debounces; and library-first — find every place where we wrote
> something that Vue, Nuxt, Nuxt UI, Pinia, vue-router, VueUse, h3/Nitro, ofetch,
> @nuxt/test-utils or Playwright already provides. Verify each such claim against the installed
> package in `node_modules` and cite the file (our versions are recent; do not rely on memory).
> Decisions recorded in `docs/decisions.md` and the plan's `Notes:` were made on purpose: do not
> re-propose a rejected option (for example `UMain`, `UAccordion`) without a new reason.
>
> Keep correctness in view: SSR and hydration (nothing time-dependent in server HTML, a clean
> console), the URL-as-state rules, caching (no error or `null` cached), accessibility, security,
> and tests that prove behaviour — no vacuous assertions (an "it did not happen" check needs a
> positive control), no order dependence, no sleeps. If a simplification would break something a
> test or a decision relies on, say so.
>
> Report in English, concise: Must fix · Reinvented wheels · Readability and simplicity · Tests ·
> Verdict. Rank by value; show before/after code for each suggestion; no linter-enforced nits.

## Severity

- 🔴 — breaks the build, a requirement (R1–R13), SSR/hydration, a security rule, or a user flow;
  a test that passes vacuously for a behaviour the plan requires.
- 🧰 / 🔧 — correct but against the owner's code style, a project rule, or harder to maintain.
- ⚡ / ♿ — performance and accessibility; ♿ becomes 🔴 when a control is unusable.
- 💬 — taste, naming, questions.
