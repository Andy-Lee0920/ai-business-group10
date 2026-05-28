# Goal Worker — Slice 2 (#422) pg_cron + UNIQUE

## Objective for `create_goal`

Complete GitHub Issue #422 on branch `feat/422-cron-unique`: make reminder dispatch scheduling reproducible and idempotent with table-level `UNIQUE (card_id, scheduled_at, channel)`, idempotent pg_cron registration, `CRON_SECRET` Bearer auth, verification tests, PR against `main`, and an issue hand-off comment without closing the issue.

## Required reading

1. `prompts/codex/2026-05-29-goal/COMMON-GOAL-RULES.md`
2. `prompts/codex/2026-05-28/slice-2-pg-cron-issue.md`
3. `prompts/codex/2026-05-28/slice-2-pg-cron-codex.md`
4. `gh issue view 422 --comments`
5. `gh issue view 380 --comments`
6. `gh issue view 379 --comments`
7. `CLAUDE.md`, ADR `0004`, `0006`, `docs/specs/spec-reminder-dispatch.md`

## Goal-specific success criteria

- Precondition #379 checked. If #379 is Red/open with failing reminder send behavior, write blocker and stop before code changes.
- Audit #380 into `audit-report-380.md`, use it during work, remove it before PR unless deployment gap evidence requires keeping a summarized note in PR body.
- Add explicit `reminder_dispatches_card_time_channel_unique` or equivalently named unique constraint.
- pg_cron migration is idempotent: unschedule or safe conflict handling before schedule.
- `POST /api/reminders/send-due` rejects missing/malformed/wrong Bearer token with 401 and structured non-PII log.
- Matching `CRON_SECRET` allows the route.
- Tests cover duplicate dispatch rejection and duplicate send-due calls preserving one row.
- `npm run typecheck` and `npm test` pass.
- PR exists and Issue #422 has evidence comment with cron.job query result or explicit deployment gap.

## Slice stop conditions

- #379 blocks the send path.
- Existing production duplicate rows would make UNIQUE migration unsafe: write data-cleanup child issue proposal.
- Supabase plan prevents pg_cron: write alternative-scheduler child issue proposal.
- Same file reaches 3 Red edits in this goal run: blocker note + stop.

## Final goal gate

Only call `update_goal(complete)` after PR URL, issue comment evidence, schema/migration evidence, tests, and clean `git diff --check` are all present.
