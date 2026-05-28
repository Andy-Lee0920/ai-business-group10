# Goal Orchestrator — Phase 2 (#424, #425)

## Objective for `create_goal`

Coordinate the dependent Phase 2 overnight batch: verify #421 + #422 are merged before starting #424, verify #423 is merged before starting #425, launch each dependent slice in a dedicated clean worktree with the matching goal prompt, and finish only after PR/issue hand-off evidence or precise blocker notes exist.

## Operating contract

- Read `prompts/codex/2026-05-29-goal/README.md` and `COMMON-GOAL-RULES.md`.
- Do not implement slice code in the orchestrator checkout.
- Do not close issues.
- Do not bypass dependency checks.

## Steps

1. Goal bootstrap: `get_goal`; create the objective above if none exists.
2. Verify merges:
   - #421 merged to `origin/main`
   - #422 merged to `origin/main`
   - #423 merged to `origin/main`
3. If #421 or #422 is missing, write `blocker-note-phase2-424-precondition.md` and do not launch #424.
4. If #423 is missing, write `blocker-note-phase2-425-precondition.md` and do not launch #425.
5. Create worktrees from fresh `origin/main`:
   - `../goal-424` branch `feat/424-push-failure`
   - `../goal-425` branch `feat/425-confirm-ui`
6. Launch independent Codex sessions with:
   - `slice-3-push-failure-goal.md`
   - `slice-4b-confirm-ui-goal.md`
7. Monitor only status, PR URLs, verification evidence, and blocker notes.

## Completion

Call `update_goal(complete)` only after both dependent slices have PR/issue hand-off evidence or documented blockers that prevent safe work.
