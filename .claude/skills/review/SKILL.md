---
name: review
description: Review changes in this repo before they are committed — runs lint, types, unit tests (and build plus the smoke test once the app renders), then walks the project checklist (state and URL sync, caching, server adapter, SSR, product logic, security, performance, accessibility, tests). Use when the user asks for a review or to check changes, runs /review, or when the phase skill reaches its review step.
---

# Review

Reports problems; never edits code during the review. Fixes happen only when the user (or the
`phase` skill) asks.

## Scope

- `--scope=working` (used by `phase`): only uncommitted changes — `git diff HEAD` plus untracked
  files from `git status --porcelain` (read them whole).
- Default: everything not yet pushed — `git diff origin/main` plus uncommitted and untracked
  files. Before the first push (no remote until plan step P8.4): `--since=<ref>` if given, else
  the last commit (`git diff HEAD~1`) plus uncommitted and untracked files.
- `--scope=all`: every tracked file (`git ls-files`), read whole.
- No git repository yet: the files the current plan step touched.
- Repository without commits (P2.5–P2.8): every file from `git status --porcelain`, read whole.

## Steps

1. **Collect the diff** for the scope above.
2. **Run the checks** that exist so far, unless called with `--no-checks`: `npm run lint:check`,
   `npm run typecheck`, `npm run test:run`; once the plan's smoke step is done, also
   `npm run build` and the smoke test. Record failures verbatim.
3. **Read the context** the diff needs: `CLAUDE.md`, the relevant parts of `docs/decisions.md`,
   `docs/api.md`, `docs/design.md`, and the plan step in progress (`docs/plan.md`).
4. **Walk `checklist.md`** — every group. Report only what the diff actually violates; quote the
   line. Grep before claiming dead code or a missing usage.
5. **Check the step's "Done when" and "Verify"** items from `docs/plan.md` if a step is in
   progress: met, not met, or not verifiable — say which.
6. **Report:**

   ```
   ## Review — <step id or scope>
   Checks: lint ✅/❌ · types ✅/❌ · tests ✅/❌ (n passed) · build ✅/❌/— · smoke ✅/❌/—

   ### 🔴 Must fix
   - file:line — problem → consequence → fix
   ### 🔧 Should fix
   ### ⚡ Performance
   ### ♿ Accessibility
   ### 💬 Nits / questions
   ### ✅ Done-when criteria
   Verdict: ⛔ Not ready — must fix | ❓ Needs discussion | ✅ Ready with suggestions | ✅ Ready
   ```

   Empty sections are omitted. The verdict is ⛔ when any check failed or any 🔴 exists.

## Severity

- 🔴 — breaks the build, a requirement (R1–R13), SSR/hydration, a security rule, or a user flow.
- 🔧 — correct but against a project rule or harder to maintain.
- ⚡ / ♿ — performance and accessibility; ♿ becomes 🔴 when a control is unusable.
- 💬 — taste, naming, questions.
