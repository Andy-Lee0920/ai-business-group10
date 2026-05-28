# Goal Worker — Slice 3 (#424) Push failure handling + re-subscribe CTA

## Objective for `create_goal`

Complete GitHub Issue #424 on branch `feat/424-push-failure`: after #421 and #422 are merged, track push delivery failures, revoke 410/404 subscriptions, log 5xx/network failures without retry, exclude revoked subscriptions from candidates, expose re-subscribe CTA, write ADR 0028, verify with unit/integration/e2e tests, create PR against `main`, and comment evidence without closing the issue.

## Required reading

1. `prompts/codex/2026-05-29-goal/COMMON-GOAL-RULES.md`
2. `prompts/codex/2026-05-28/slice-3-push-failure-issue.md`
3. `prompts/codex/2026-05-28/slice-3-push-failure-codex.md`
4. `gh issue view 424 --comments`
5. `gh issue view 421 --comments`
6. `gh issue view 422 --comments`
7. `CLAUDE.md`, ADR `0004`, `0006`, `docs/specs/spec-reminder-dispatch.md`

## Goal-specific precondition

Before editing, verify #421 and #422 are merged into `origin/main` and this branch is based on fresh `origin/main`. If not, write `blocker-note-S0-precondition.md` and stop.

## Goal-specific success criteria

- Migration adds `push_subscriptions.revoked_at`, `reminder_dispatches.failed_at`, and `reminder_dispatches.failure_reason` with RLS unchanged.
- Web-push 410/404 sets subscription `revoked_at` and failure reason `subscription_revoked` without logging PII.
- Web-push 5xx writes `push_service_5xx_<code>` failure without revoking subscription and without immediate retry queue.
- Other network error writes `network_error_<code-or-kind>` without type escapes.
- Candidate query/function excludes revoked subscriptions.
- Home CTA reuses #421 pattern and labels active-subscription-missing state as `알림 다시 받기`.
- ADR 0028 exists and prohibits retry queue and user-identifiable 410 logs.
- `npm run typecheck`, `npm test`, and required e2e pass.
- PR exists and Issue #424 has evidence comment.

## Slice stop conditions

- #421 or #422 not merged.
- web-push error shape cannot expose status code without unsafe type escape.
- Subscription seed/test helper missing enough to make e2e meaningful.
- Same file reaches 3 Red edits in this goal run: blocker note + stop.

## Final goal gate

Only call `update_goal(complete)` after PR URL, issue comment evidence, ADR, tests/e2e, and clean `git diff --check` are all present.
