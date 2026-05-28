# Goal Worker — Slice 1 (#421) PWA infra closure

## Objective for `create_goal`

Complete GitHub Issue #421 on branch `feat/421-pwa-inline-cta`: close the PWA push infra gap by adding inline user-gesture-only push permission CTA, iOS Safari non-installed UA guard, ADR 0026, regression tests, e2e evidence, PR against `main`, and an issue hand-off comment without closing the issue.

## Required reading

1. `prompts/codex/2026-05-29-goal/COMMON-GOAL-RULES.md`
2. `prompts/codex/2026-05-28/slice-1-pwa-infra-issue.md`
3. `prompts/codex/2026-05-28/slice-1-pwa-infra-codex.md`
4. `gh issue view 421 --comments`
5. `gh issue view 377 --comments`
6. `CLAUDE.md`, `CONTEXT.md`, ADR `0004`, `0006`, `0013`

## Goal-specific success criteria

- Audit #377 acceptance into `audit-report-377.md`, use it during work, remove it before PR unless a blocker note says otherwise.
- Home or reminder inline CTA calls `Notification.requestPermission` only inside a user click path.
- Mount/useEffect auto permission call has a regression test that fails if reintroduced.
- Permission denial is sticky enough that same-page revisit does not re-request.
- iPhone/iPad non-installed Safari path displays one-line guidance and calls permission request 0 times.
- ADR 0026 exists and records inline CTA as the accepted trigger.
- `npm run typecheck`, `npm test`, and required Playwright e2e pass.
- PR exists and Issue #421 has evidence comment.

## Slice stop conditions

- All #377 acceptance is already green: stop after evidence comment recommendation; do not create churn.
- Missing VAPID env blocks meaningful e2e: write child-issue proposal blocker note.
- iOS install guide becomes required: split child issue, do not expand this slice.
- Same file reaches 3 Red edits in this goal run: blocker note + stop.

## Final goal gate

Only call `update_goal(complete)` after PR URL, issue comment evidence, tests, ADR, and clean `git diff --check` are all present.
