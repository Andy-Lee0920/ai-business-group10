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
| `care_action_cards` | #25 / #24; schedule decision #55 / ADR 0003; #171 | card model migration + prescription capture migration | own couple only for app; anon blocked; partner view only via server token projection; clinic visits stay card-backed for SLC; prescription photos are source evidence only | confirmed constraints; clinic_visit scheduling via `scheduled_at` / `care_date`; prescription_capture_status/photo_url present; card creation; anon direct read denied |
| `partner_share_links` | #27 / #198 | partner migration + partner account join migration | authenticated owner can create/revoke; anon cannot direct query; token hash only; accepted links bind exactly one authenticated partner account via `accepted_by` / `accepted_at` | one active link, 7-day TTL, raw token absent, own/expired/used invite safely rejected |
| `partner_share_events` | #27 | partner migration | server-controlled partner token flow; authenticated owner can observe relevant acknowledgement state if needed | view/ack events record revision seen |
| `treatment_cycles` | #144 / #147 / #170 | treatment timeline migration + result protection metadata | own couple only; blocked until Privacy Gate accepted; no anon direct access; Result Protection metadata remains patient-owned | cycle insert/select isolation; privacy gate rejection; negative result protection columns present |
| `treatment_milestones` | #144 / #147 | treatment timeline migration | own couple only using direct `couple_id` plus cycle-match trigger; partner token reads server-side only | milestone insert/select isolation; cycle/couple mismatch rejected |
| `care_memberships` | #158 / #160 / #161 / #199 | care OS architecture migration + patient sharing scope migration | own couple only; binds treatment cycle to patient/partner role, patient-owned sharing scope, and assist permission; sharing scope changes only through authenticated patient RPC | cycle/member mismatch rejected; partner cannot cross cycles; scope persistence/projection matrix covered |
| `injection_logs` | #162 | care OS architecture migration | own couple only for authenticated patient; partner token writes only through `record_partner_assisted_injection`; patient final confirmation required | partner-assisted record pending; patient confirmation finalizes; anon direct table access denied |
| `user_ai_settings` | #28 P1 | llm migration | own user metadata only; raw key in Vault only | raw key not selectable/logged; P0 works without key |
| `couple_journal_entries` | #400 / ADR 0015 | records/community foundation migration | own couple only through `current_user_couple_ids()`; blocked until Privacy Gate accepted; partner-authored journal entries force `pain_score NULL`; photos referenced only by signed URL | `records-community-schema-rls.test.ts`; partner pain_score NULL unit/integration follow-up |
| `community_identities` | #400 / ADR 0016 | records/community foundation migration | authenticated actor may create/update own couple+role identity; nickname is globally unique; server/admin may seed official identities | `records-community-schema-rls.test.ts`; identity uniqueness tests |
| `community_posts` | #400 / #402 / ADR 0016 | records/community foundation migration + moderation pipeline | approved + audience-matched community reads only; author identity can read pending own posts and soft-delete own rows; service role may moderate | `records-community-schema-rls.test.ts`; moderation pending hidden tests |
| `community_comments` | #400 / #402 / ADR 0016 | records/community foundation migration + moderation pipeline | approved + audience-matched community reads only through approved parent post; author identity can read pending own comments and soft-delete own rows | `records-community-schema-rls.test.ts`; nested comment moderation tests |
| `community_post_empathies` | #400 / ADR 0016 | records/community foundation migration | actor couple+role only; unique `(post_id, actor_couple_id, actor_role)`; reads follow approved post audience | `records-community-schema-rls.test.ts`; empathy toggle/count unit tests |
| `community_reports` | #400 / #402 / ADR 0016 | records/community foundation migration + moderation queue | reporter identity can insert/read own reports; unique `(reporter_identity_id, target_type, target_id)`; service role resolves queue | `records-community-schema-rls.test.ts`; duplicate/self-report tests |
| `moderation_filter_rules` | #400 / #402 / ADR 0016 | records/community foundation migration | service-role only; no authenticated direct grants; deterministic moderation reads through server code | `records-community-schema-rls.test.ts`; moderation filter unit tests |
| `couple-journal-photos` | #400 / ADR 0015 | records/community foundation migration | private storage bucket; object path first segment must be own `couple_id`; signed URL only; blocked until Privacy Gate accepted | `records-community-schema-rls.test.ts`; signed URL couple-only contract |
| `service_role_audit_logs` | #403 / D6 / ADR 0017 | service-role audit migration | service-role only; no authenticated direct grants; records actor, route, target_type, target_id, action, ts for server exceptions | service-role audit contract; admin audit view tests |

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
- Accepted partner links create `care_memberships` for the shared cycle; they do not grant full medical edit access.
- ADR 0003 keeps clinic visit scheduling on `care_action_cards` for SLC; do not add `clinic_visits` or `visit_id` before P1 `#44` reopens the decision with concrete recurrence/reschedule requirements.
- TreatmentTimeline tables are Post-SLC phase hints only. `treatment_milestones` must not expose raw notes to partner token clients and must not store estimated/template dates as active care-surface truth.
- Care OS membership must preserve one shared treatment cycle with role-specific patient/partner surfaces.
- Patient-owned sharing scope defaults to `care`; `emotional` is opt-in and `basic` hides medication/emotion/memo detail.
- Patient-owned sharing scope must persist in `care_memberships` and drive `get_partner_action_view`; demo-only sharing state is not sufficient.
- Partner assist permissions never include medication card edit, dosage change, or prescription modification.
- Prescription Capture may attach `prescription_photo_url`, but dose/name/time must remain user-confirmed fields; no OCR inference may become medication authority.
- Injection completion trust comes from `injection_logs`, not a bare completed boolean: `administered_by`, `recorded_by`, and `confirmed_by_patient` must remain distinct.
- Result Protection Mode is always free and bypasses subscription, Cycle Pass, and promotional gates.

- Records/community closed-beta surfaces must preserve actor-specific boundaries: couple journal is couple-only, community feed reads are `approved` plus audience-matched, and pending author rows are visible only to their own identity.
- Partner-authored journal entries must not persist medical self-report fields; `pain_score` is forced to `NULL` server-side.
- Service-role exceptions must write `service_role_audit_logs` through the audited helper before admin moderation/seed features are considered Green.

## Minimum integration tests

- RLS couple isolation for all couple-scoped tables.
- Anon cannot directly read `care_action_cards` or partner tables.
- Privacy Gate not accepted → sensitive write rejected.
- Confirm transaction is atomic.
- Expired/revoked partner link returns safe state with no card/raw memo leak.
- Partner account join accepts a token only for a logged-in non-owner and returns partner projection membership, not a patient-home clone.
- Partner acknowledgement records `card_revision_seen` and `card_updated_at_seen`.

- Records/community schema contract covers table creation, RLS enablement, audience-approved community reads, partner `pain_score NULL`, storage bucket privacy, and service-role audit contract.
- Community pending visibility, signed URL couple-only behavior, deterministic moderation false-positive set, and empathy count semantics remain required before #401/#402/#403 closure.
