# Goal Orchestrator — Phase 1 (#421, #422, #423)

## Objective for `create_goal`

Coordinate the Phase 1 overnight batch without editing product code directly: ensure Slice #421, #422, and #423 each run in a dedicated clean worktree with the matching goal prompt, monitor their PR/issue evidence, and stop only when all three have either PR hand-off evidence or precise blocker notes.

## Operating contract

- Read `prompts/codex/2026-05-29-goal/README.md` and `COMMON-GOAL-RULES.md`.
- Use one active goal for this orchestrator only. Worker Codex sessions own their own slice goals.
- Do not implement slice code in the orchestrator checkout.
- Do not close issues.
- Do not merge PRs automatically unless the human explicitly asked for merge/deploy.

## Steps

1. Goal bootstrap: `get_goal`; create the objective above if none exists.
2. Verify prompt pack is available from clean `origin/main` or copy it into each worktree.
3. Create or verify worktrees:
   - `../goal-421` branch `feat/421-pwa-inline-cta`
   - `../goal-422` branch `feat/422-cron-unique`
   - `../goal-423` branch `feat/423-offset-domain`
4. Launch three independent Codex sessions with:
   - `slice-1-pwa-infra-goal.md`
   - `slice-2-pg-cron-goal.md`
   - `slice-4a-offset-domain-goal.md`
5. Periodically collect status only:
   - branch
   - latest commit
   - tests run
   - PR URL or blocker-note path
6. Final gate: all three have PR URLs and issue comments, or blocker notes that explain why Phase 2 must not start.

## Completion

Call `update_goal(complete)` only after Phase 1 status is fully accounted for. If a child slice blocks Phase 2, do not mark complete unless the blocker is documented and surfaced to the human.
