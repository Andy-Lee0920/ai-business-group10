# Fevio Codex Goal Batch — 2026-05-29

This directory converts the 2026-05-28 overnight Codex prompts into goal-mode prompts. Use these when the Codex session has `/goal` or goal tools and you want the agent to keep a durable completion contract until PR + issue hand-off are done.

## Why this pack exists

The original `prompts/codex/2026-05-28/*-codex.md` files are good execution prompts. The files here add goal-mode controls:

- explicit `create_goal` objective per slice
- clean-worktree preflight
- no `update_goal(complete)` until PR + issue comment
- blocker-note behavior aligned with Codex goal blocked semantics
- restart/resume rules for branch + commits
- evidence block suitable for PR and GitHub issue comments

## Files

| File | Use |
|---|---|
| `COMMON-GOAL-RULES.md` | Shared goal bootstrap, strict loop, completion gates |
| `phase-1-orchestrator-goal.md` | Optional leader prompt to launch/monitor Slice 1, 2, 4a worktrees |
| `phase-2-orchestrator-goal.md` | Optional leader prompt after Slice 1/2/4a PRs merge |
| `slice-1-pwa-infra-goal.md` | Goal-mode worker prompt for #421 |
| `slice-2-pg-cron-goal.md` | Goal-mode worker prompt for #422 |
| `slice-4a-offset-domain-goal.md` | Goal-mode worker prompt for #423 |
| `slice-3-push-failure-goal.md` | Goal-mode worker prompt for #424, after #421 + #422 |
| `slice-4b-confirm-ui-goal.md` | Goal-mode worker prompt for #425, after #423 |

## Safe execution order

### Phase 1 — parallel, dedicated worktrees

Run only from a clean `origin/main` base. Do not run three sessions in the same checkout.

```bash
cd /Users/reliqbit_mac/projects/Fevio/Fertility-support/ai-business-group10
git fetch origin

git worktree add ../goal-421 origin/main -b feat/421-pwa-inline-cta
git worktree add ../goal-422 origin/main -b feat/422-cron-unique
git worktree add ../goal-423 origin/main -b feat/423-offset-domain

(cd ../goal-421 && codex exec --full-auto < prompts/codex/2026-05-29-goal/slice-1-pwa-infra-goal.md)
(cd ../goal-422 && codex exec --full-auto < prompts/codex/2026-05-29-goal/slice-2-pg-cron-goal.md)
(cd ../goal-423 && codex exec --full-auto < prompts/codex/2026-05-29-goal/slice-4a-offset-domain-goal.md)
```

If the prompt pack is not committed to `main`, copy this directory into each worktree before running.

### Phase 2 — after merge

```bash
cd /Users/reliqbit_mac/projects/Fevio/Fertility-support/ai-business-group10
git fetch origin

git worktree add ../goal-424 origin/main -b feat/424-push-failure
git worktree add ../goal-425 origin/main -b feat/425-confirm-ui

(cd ../goal-424 && codex exec --full-auto < prompts/codex/2026-05-29-goal/slice-3-push-failure-goal.md)
(cd ../goal-425 && codex exec --full-auto < prompts/codex/2026-05-29-goal/slice-4b-confirm-ui-goal.md)
```

## Goal-mode rule of thumb

One Codex session = one active slice goal. Do not reuse a session with a completed goal until `/goal clear` or a fresh session is used.
