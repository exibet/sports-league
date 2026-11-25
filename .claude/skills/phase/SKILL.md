---
name: phase
description: Work through docs/plan.md one step at a time — pick the next step (or the one named), implement it, run the verification loop, run the review skill, tick the step with a short note, propose a commit message and stop for the owner's approval. Use when the user runs /phase, asks for the next step or to continue the plan, or names a plan step id like P2.3.
---

# Phase

Executes `docs/plan.md`, one step per run, or a whole phase when the owner asks. Never commits, pushes or opens a PR on its own — it
stops at "ready to commit" and waits.

## Plan format (contract with `docs/plan.md`)

```
- [ ] **P2.3 — Server adapter for seasons**
  - Goal: one or two sentences
  - Depends on: P2.2
  - Files: `server/utils/sportsdb.ts`, `tests/unit/server/sportsdb.test.ts`
  - Tests: the cases to write first (one line each)
  - Done when: verifiable criteria
  - Verify: a command or an observable check
  - Out of scope: what this step must not touch
  - Commit: `feat(api): normalise season badges`
  - Requirements: R7, R8
```

`[x]` done, `[~]` in progress, `[ ]` not started, `[-]` cut (with a `Notes:` reason). A
`  - Notes:` line may be added during execution.

## Steps

1. **Pick the step:** the one the user named, else a `[~]` left in progress, else the first `[ ]`
   whose `Depends on` steps are `[x]`. If a dependency is not done, say so and ask.
   Skip `[-]` steps; a dependency on a `[-]` step means ask.
   **Phase gate:** Phase 3 starts after P2.8 is `[x]`; a later phase starts only after the
   previous phase's commit is made. Work on `dev`, one commit per phase; `main` changes only
   through a `dev` → `main` PR that the owner merges (push and PR only when the owner asks).
   **Owner steps** (marked "(owner)"): list the owner's actions, wait for the confirmation, then
   tick; no implementation, review or commit. P2.8 is the one owner step with a commit: it stays
   `[ ]` in that commit and is ticked in the next one.
2. **Start clean.** If the working tree has changes that do not belong to this step, stop and ask
   (commit them, stash them, or treat them as part of the step). A tick in `docs/plan.md` left by
   a step without its own commit (owner steps) is not a stray change: it rides in this commit.
   Changes left by earlier steps of the same phase belong to the phase (one commit per phase):
   do not stop on them.
3. **Load context:** `CLAUDE.md`, the step's requirements in `docs/requirements.md`, the relevant
   sections of `docs/decisions.md`, `docs/api.md`, `docs/design.md`. Restate the goal, "Done when"
   and "Out of scope" in a few lines.
4. **Mark it `[~]`** in `docs/plan.md`.
5. **Tests first** where the step lists them, then the implementation. Only what the step says;
   anything else noticed goes into the report as a suggestion. If the step turns out wrong or too
   big, stop and propose a split or a plan change instead of improvising.
6. **Verify:** the loop commands that exist so far (`npm run lint` and `npm run typecheck` from
   P2.3, `npm run test:run` from P2.4), plus `npm run build` and the
   smoke test once the plan's smoke step is done, plus the step's own `Verify`. Fix failures the
   step caused. Never weaken a rule, threshold or test to pass.
7. **Review:** run the `review` skill with `--scope=working --no-checks`. Fix every 🔴, then run
   step 6 again. List the remaining 🔧/💬 in the report.
8. **Tick the step** `[x]`; add a `Notes:` line only if something differs from the plan. If a
   decision changed, update `docs/decisions.md`.
9. **Report and stop:**

   ```
   P2.3 — Server adapter for seasons ✅
   Changed: <files>
   Checks: lint ✅ · types ✅ · tests ✅ (n) · build ✅/— · smoke ✅/—
   Review: ✅ Ready (or the open 🔧/💬 items)
   Done when: <each criterion → met>
   Proposed commit: feat(api): normalise season badges
   Next: P2.4 — …
   ```

   `Proposed commit` is the step's `Commit:` line, a line of the phase commit's body. If the owner
   asked to run the whole phase, continue with the next step after the report instead of waiting.
   At the last step of a phase, add the phase's checkpoint and the proposed phase commit (summary
   naming the phase, body listing the steps' `Commit:` lines) to the report, then wait. Commit only
   when the owner says so (Conventional Commits, no `Co-Authored-By`, never `--no-verify`).
