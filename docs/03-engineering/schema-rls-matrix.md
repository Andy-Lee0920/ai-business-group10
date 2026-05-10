# Supabase Schema / RLS Matrix

This matrix keeps the final PRD data model aligned before implementation across #23–#27.

## Owner matrix

| Table | Owner issue | Migration owner | RLS / access intent | Required tests |
|---|---|---|---|---|
| `couples` | #23 | auth/bootstrap migration | authenticated primary user can access own couple only through `couple_members.user_id = auth.uid()` | couple isolation, idempotent bootstrap |
| `couple_members` | #23 | auth/bootstrap migration | authenticated user can read own couple membership; partner placeholder has `user_id NULL`; no anon direct access | primary + partner placeholder rows exist; other couple blocked |
| `couple_states` | #23 / #26 | auth/bootstrap migration | own couple only; writes through authenticated app/server actions | privacy gate accepted, waiting mode, first capture set once |
| `visit_inputs` | #24 | capture migration | own couple only; blocked until Privacy Gate accepted | capture creates raw input only; other couple blocked |
| `action_split_drafts` | #24 | capture migration | own couple only; draft shell created on Capture CTA | draft shell created; classification buttons do not write DB |
| `split_candidates` | #35 / #24 | schema baseline or capture migration | own couple through parent draft/couple; created only on Confirm | Confirm batch insert; no rows before Confirm |
| `care_action_cards` | #25 / #24; schedule decision #55 / ADR 0003 | card model migration | own couple only for app; anon blocked; partner view only via server token projection; clinic visits stay card-backed for SLC | confirmed constraints; clinic_visit scheduling via `scheduled_at` / `care_date`; card creation; anon direct read denied |
| `partner_share_links` | #27 | partner migration | authenticated owner can create/revoke; anon cannot direct query; token hash only | one active link, 7-day TTL, raw token absent |
| `partner_share_events` | #27 | partner migration | server-controlled partner token flow; authenticated owner can observe relevant acknowledgement state if needed | view/ack events record revision seen |
| `user_ai_settings` | #28 P1 | llm migration | own user metadata only; raw key in Vault only | raw key not selectable/logged; P0 works without key |

## Non-negotiable invariants

- Privacy Gate must be accepted before creating sensitive rows: `visit_inputs`, `action_split_drafts`, `split_candidates`, `care_action_cards`, or `partner_share_links`.
- Capture CTA creates only `visit_inputs` + `action_split_drafts`.
- Manual classification state stays client-side until Confirm.
- Confirm transaction creates `split_candidates` + `care_action_cards` and sets `couple_states.first_capture_completed_at` only if it is `NULL`.
- `safety_level` / `display_safety_level` is not stored as LLM medical judgment.
- Home executable components render confirmed cards only.
- Partner view is a sanitized live server projection; no frozen snapshot table for v1.0.
- Partner raw token is never stored; store `SHA-256(token)` only.
- Partner links expire after 7 days and can be explicitly revoked.
- ADR 0003 keeps clinic visit scheduling on `care_action_cards` for SLC; do not add `clinic_visits` or `visit_id` before P1 `#44` reopens the decision with concrete recurrence/reschedule requirements.

## Minimum integration tests

- RLS couple isolation for all couple-scoped tables.
- Anon cannot directly read `care_action_cards` or partner tables.
- Privacy Gate not accepted → sensitive write rejected.
- Confirm transaction is atomic.
- Expired/revoked partner link returns safe state with no card/raw memo leak.
- Partner acknowledgement records `card_revision_seen` and `card_updated_at_seen`.
