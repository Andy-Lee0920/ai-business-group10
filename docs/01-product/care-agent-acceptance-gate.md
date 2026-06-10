# Care Agent / concern-triage acceptance gate

Issue: [#462](https://github.com/Andy-Lee0920/ai-business-group10/issues/462)  
Parent review gate: [#456](https://github.com/Andy-Lee0920/ai-business-group10/issues/456)  
Status: Deferred — keep ADR 0032 Proposed until a separate implementation issue is accepted.

## Decision

Do not implement the Care Agent / concern-triage WIP before the 2026-06-20 presentation. Treat the WIP as architectural evidence only.

The product direction is conditionally acceptable only as a deterministic routing aid, not as a chatbot, emotional counseling surface, or medical-advice surface. Code, migrations, and bottom-navigation changes remain out of scope for this gate.

## Gate answers

| Question | Gate answer |
| --- | --- |
| Is the `케어 에이전트` label appropriate? | Not yet. The label can read like a chatbot or counseling tool. Future copy should prefer a bounded task label such as `확인 도우미` or another route-selection label unless a separate copy review accepts `케어 에이전트`. |
| Does the flow stay inside `user input -> fixed schema classification -> existing surface routing`? | The WIP classifier mostly does, but the textarea-first UI still invites open-ended chat. Future implementation must show fixed actions and route chips before any free-text interpretation feels like a conversation. |
| Is raw utterance / LLM response non-storage enforced? | Not enough for merge yet. The WIP migration keeps `concern_signals` tag-only, but enforcement must be proven by route tests that no raw utterance, source text, raw memo, or model body is persisted. |
| Should `concern_signals` be created now? | No. Defer table creation until a separate accepted implementation issue proves the write path, RLS, and non-storage tests. |
| Are `clinic_questions` stored medical answers? | They must not be. Future scope may store only user-confirmed questions to ask the clinic, status, and related card id. Clinic answers, generated advice, and model text stay out of this table. |
| Should the central `+` route to `/care-agent` now? | No. Keep the current bottom sheet with direct `/add` and `/clinic-update` paths for demo readiness. Replacing it would trade direct execution for a new product concept before the presentation. |

## Required invariants for any later implementation issue

1. No medical advice generation.
2. Deterministic classifier before any AI involvement.
3. No raw utterance, raw clinical text, model response body, or generated advice persisted.
4. `concern_signals` must be tag-only and primary-private.
5. `clinic_questions` must contain only user-confirmed questions, never stored medical answers.
6. Couple-scoped RLS and primary-private access must be covered by migration contract tests.
7. Partner views must not expose concern signals or clinic questions.
8. Existing direct routes (`/add`, `/clinic-update`) must remain reachable even if a future entry surface is added.

## Future implementation acceptance checklist

A future issue may move ADR 0032 from Proposed to Accepted only if it includes:

- accepted naming/copy for the entry point;
- a fixed schema with enumerated intent/action/template ids;
- tests proving classifier output excludes raw user text and card specifics;
- route tests proving raw utterance/model body is not inserted;
- migration tests proving tag-only `concern_signals`, confirmed-question-only `clinic_questions`, primary-private RLS, and no partner exposure;
- e2e or unit coverage showing `/add` and `/clinic-update` remain directly accessible;
- explicit non-goals for counseling, diagnosis, medication/dose advice, and model-authored instructions.

## WIP disposition

Keep as evidence only:

- `app/(authed)/care-agent/*`
- `src/domain/concern-triage.ts`
- `src/types/concern-triage.types.ts`
- `tests/unit/concern-triage.test.ts`
- `supabase/migrations/202605300001_concern_triage_care_agent.sql`
- `tests/unit/concern-triage-infra-contract.test.ts`

Do not merge those files directly from the WIP branch.
