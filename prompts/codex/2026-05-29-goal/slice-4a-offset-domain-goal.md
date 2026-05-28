# Goal Worker — Slice 4a (#423) split_candidates offset + mustInlineQuote

## Objective for `create_goal`

Complete GitHub Issue #423 on branch `feat/423-offset-domain`: add nullable split candidate source offsets, preserve offsets through `splitLines`, persist offsets on candidate creation paths, add the `mustInlineQuote` domain policy, write ADR 0029, verify with unit/integration tests, create PR against `main`, and comment evidence without closing the issue.

## Required reading

1. `prompts/codex/2026-05-29-goal/COMMON-GOAL-RULES.md`
2. `prompts/codex/2026-05-28/slice-4a-offset-domain-issue.md`
3. `prompts/codex/2026-05-28/slice-4a-offset-domain-codex.md`
4. `gh issue view 423 --comments`
5. `CLAUDE.md`, `TODOS.md`, `CONTEXT.md`, ADR `0013`, `docs/specs/spec-capture-action-split.md`

## Goal-specific success criteria

- Migration adds `source_offset_start int null` and `source_offset_end int null` to `split_candidates`; RLS unchanged; legacy NULL accepted.
- `splitLines` returns text with UTF-16 string offsets such that `raw.slice(offsetStart, offsetEnd) === text` for required fixtures.
- All `splitLines` callers are updated intentionally; if callers exceed 30, stop with blocker and caller-migration child issue proposal.
- `POST /api/capture`, photo analyze, and text analyze candidate insert paths persist offsets where applicable.
- `mustInlineQuote` is a domain function, not a component-local rule.
- Tests include offset fixtures and policy fixtures.
- ADR 0029 exists and explains mandatory inline quote rule.
- `npm run typecheck` and `npm test` pass.
- PR exists and Issue #423 has evidence comment.

## Slice stop conditions

- More than 30 direct `splitLines` callers.
- Multibyte/Hangul offset roundtrip fails under JavaScript slice semantics.
- Existing row backfill becomes necessary for acceptance: split child issue; do not make columns NOT NULL.
- Same file reaches 3 Red edits in this goal run: blocker note + stop.

## Final goal gate

Only call `update_goal(complete)` after PR URL, issue comment evidence, ADR, tests, and clean `git diff --check` are all present.
