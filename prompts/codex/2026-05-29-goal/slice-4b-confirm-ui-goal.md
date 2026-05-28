# Goal Worker — Slice 4b (#425) Confirm UI side-by-side

## Objective for `create_goal`

Complete GitHub Issue #425 on branch `feat/425-confirm-ui`: after #423 is merged, render split-review raw text beside candidates, highlight candidate source ranges, force inline source quotes for `mustInlineQuote` cards on mobile, keep non-mandatory quotes behind a toggle, verify no pre-confirm persistence, create PR against `main`, and comment evidence without closing the issue.

## Required reading

1. `prompts/codex/2026-05-29-goal/COMMON-GOAL-RULES.md`
2. `prompts/codex/2026-05-28/slice-4b-confirm-ui-issue.md`
3. `prompts/codex/2026-05-28/slice-4b-confirm-ui-codex.md`
4. `gh issue view 425 --comments`
5. `gh issue view 423 --comments`
6. `CLAUDE.md`, `TODOS.md`, `CONTEXT.md`, ADR `0013`, `0029`

## Goal-specific precondition

Before editing, verify #423 is merged into `origin/main`, `mustInlineQuote` exists in `src/domain`, and split candidate offset columns exist in migrations/types. If not, write `blocker-note-S0-precondition.md` and stop.

## Goal-specific success criteria

- `app/split-review/page.tsx` fetches `visit_inputs.raw_text` server-side for the relevant candidates and passes sanitized needed data to the client only for this review surface.
- Desktop `>=768px` layout shows raw text and candidate cards in the same viewport with offset highlight.
- Offset NULL fallback uses substring matching and visible `≈` marker.
- Mobile `<768px`: mandatory injection/medication + my_action cards show quote inline with no toggle; non-mandatory cards use `원문 보기` toggle/bottom sheet.
- UI calls/imports domain `mustInlineQuote`; it does not duplicate the policy in component code.
- Rendering `/split-review` before confirm does not write `care_action_cards`.
- Unit fixtures and desktop/mobile e2e cover mandatory and non-mandatory quote behavior.
- `npm run typecheck`, `npm test`, and required e2e pass.
- PR exists and Issue #425 has evidence comment with screenshots or screenshot artifact paths.

## Slice stop conditions

- #423 not merged or offset/policy contract missing.
- RLS makes raw_text server fetch unsafe without schema decision.
- 360px mobile cannot fit mandatory quote in same viewport without product/UX tradeoff.
- Same file reaches 3 Red edits in this goal run: blocker note + stop.

## Final goal gate

Only call `update_goal(complete)` after PR URL, issue comment evidence, screenshots/e2e, no pre-confirm write proof, tests, and clean `git diff --check` are all present.
