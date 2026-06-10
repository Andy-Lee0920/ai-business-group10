# ADR 0028 — Manual clinic logging write bridge; migrate producer before consumer

## Status

Accepted — 2026-06-07

## Context

The #433 locked product spine is: post-visit clinic logging → confirmed care action → today execution → partner-safe behavior prompt. This requires a single canonical confirmed-action source. ADR 0013 named `care_action_cards` that source and migrated the **photo/OCR/text** lane onto it (`photo/text-analyze → split_candidates → /api/onboard/candidates/confirm → care_action_cards`).

ADR 0013 did **not** migrate the **manual memo** path. Code audit (2026-06-07) confirms the gap:

| Logging path | Write target | Lane |
|---|---|---|
| Manual memo / schedule (`ClinicUpdateForm` → `/api/clinic-update`) | `clinic_updates` + `schedule_items` | legacy |
| Photo / text analyze (`*-analyze` → `candidates/confirm`) | `split_candidates` → `care_action_cards` | canonical |

So `care_action_cards` is fed **only** by the photo/text extraction lane. The most natural user action — open the app after a visit and type/short-note what the clinic said — writes to `schedule_items` and never reaches the canonical lane. The canonical confirmed-action table is, in practice, populated only when a user happens to take the OCR/text-analyze path.

A prior migration proposal sequenced `/partner/[token]` read migration first. Audit shows that order is unsafe: migrating partner **read** to `care_action_cards` before the manual logging **write** reaches `care_action_cards` makes manual-memo-logged actions disappear from Partner View — directly breaking the spine's terminal step (partner-safe behavior prompt), which is Fevio's product edge.

## Options compared

| Option | Shape | Risk |
|---|---|---|
| A. Write-bridge first (chosen) | Build manual memo → draft candidates → user confirm → `care_action_cards`. Migrate partner read only after manual logging populates canonical. | One-time bridge build; preserves confirmation-first. |
| B. Promote photo/text capture to the only + primary action | Demote manual memo to fallback. Fast (already canonical) but loses the "type a short note / quick schedule change / 저녁 주사" manual intents that have no document to scan. | Narrows real post-visit intents. |
| C. `schedule_items → care_action_cards` auto-projection | Keep memo→schedule_items, project into canonical. Minimal write rework. | Auto-projection bypasses or blurs user confirmation, violating the confirmation-first invariant (ADR 0013 rule #3, CONTEXT "Care action card"). Long-term structure dirtier. |

## Decision

Adopt **Option A — write-bridge first, producer before consumer.**

### Rules

1. **Manual logging must produce canonical candidates by reusing the existing capture/confirm machinery.** The canonical engine already exists: `src/lib/capture-confirm-store.ts` writes `visit_inputs → action_split_drafts → split_candidates → care_action_cards` (migration `202605100003_capture_confirm.sql`), matching the CONTEXT chain Visit input → Split draft → Split candidate → Care action card. The manual memo bridge **routes through this engine**, not a parallel path. Concretely: manual memo persists a `visit_inputs` row (draft-first, raw note preserved), generates `split_candidates`, and creates `care_action_cards` only on explicit user confirm. `schedule_items` must no longer be the manual logging write target.
   - Reuse `split_candidates` (CONTEXT "Split candidate"). **Do not introduce a parallel `care_action_candidates` model** — it would be a second name for an existing glossary concept (the exact drift CONTEXT.md prevents).
   - `split_candidates.visit_input_id` is `NOT NULL → visit_inputs`, so the draft must be a `visit_inputs` row. **Do not perpetuate `clinic_updates` as a parallel raw store** for the canonical path; converge manual logging onto `visit_inputs` (CLAUDE.md anti-pattern §1 — no parallel lanes).
2. **Confirmation-first preserved.** Executable `care_action_cards` are still created only on explicit user confirm of owner/type/time. No automatic `schedule_items → care_action_cards` projection that bypasses confirmation.
3. **Producer-before-consumer migration order.** Read consumers are migrated only after the manual write path populates `care_action_cards`. Migrating a reader before its dominant producer risks data disappearance.
4. **`schedule_items` stays subordinate.** It remains a legacy fallback / derived scheduling projection during migration (see CONTEXT "Schedule item"), never the canonical meaning of a confirmed action, and not a new-feature write target (ADR 0013 rule #5 upheld).
5. **Structured manual input bypasses `split_candidates`, not the canonical writer.** Structured manual input does not need `split_candidates` because the user has already supplied the structured fields that `split_candidates` normally derive from ambiguous source text. However, it must still preserve provenance in `visit_inputs` and must use the shared canonical care-action writer. Bypassing `split_candidates` is allowed; bypassing confirmation or creating a new parallel `care_action_cards` insert path is not.
   - Input routing: **ambiguous input** (photo / text paste / free memo) → `visit_inputs → action_split_drafts → split_candidates → user review/confirm → care_action_cards`; **structured manual input** (medication / dosage / days / time picker) → `visit_inputs` as evidence → existing ClinicUpdateForm confirm step → `care_action_cards`.
   - Two distinct ambiguities: **(a) source-text parsing ambiguity** is `split_candidates`' job; **(b) sharing / role / safety-policy judgment** is the job of confirm validation + projection policy and still applies to structured input. Structured input has little (a) but retains (b) — so it skips split candidates but never skips confirm/policy validation.
7. **Structured manual input defaults to patient-private.** Because it bypasses `split_candidates`, it must collect ownership and partner visibility in the confirm step. The default is `assignee_role=primary_user` and `partner_visible=false`. Partner visibility is explicit opt-in per card and must produce only sanitized role prompts, not raw sensitive medical detail. UI components for ownership selection may be shared with split review, but the structured path must not reintroduce `split_candidates` as a staging model. Toggle copy is behaviour-framed ("파트너가 도울 일로 만들기"), not "share / 의료정보 공유". `card_type`-based auto-recommendation of sharing is out of scope for v0 — `card_type` alone cannot judge shareability (an injection may be partner-assisted or a private sensitive treatment).
   - **Partner prompts in v0 are deterministic projections, not user-authored messages.** The projection layer already exists and is canonical-shaped: `src/domain/partner-role-projection.ts` (`translateCareCardToPartnerRole`, `card_type` → fixed `partner_role`/`partner_action`, no LLM, no free text) and `src/services/partner-view.ts` (`serializePartnerViewCards(cards: CareActionCard[])`, `PARTNER_VIEW_ITEM_FIELDS` allowlist, `partner_visible` gate). `translateCareCardToPartnerRole` remains the single partner prompt policy. Structured confirm collects only `assignee_role` and `partner_visible`; it does **not** collect a free-text `partner_prompt`. Partner view renders only the projection/allowlisted fields from `serializePartnerViewCards`, never raw card details or free-text notes. A user-authored partner message would require sensitive-detail moderation (hospital names, values, drug/dose, results) and is out of v0 scope.
8. **A shared canonical care-action writer must be extracted first.** No single writer exists today: `care_action_cards` inserts are scattered across `app/api/onboard/candidates/confirm/route.ts`, `app/api/schedule/complete/route.ts`, and `src/lib/sensitive-care-write.ts`. Until these are consolidated into one shared canonical writer, the structured-confirm path cannot satisfy rule #5 without becoming a fourth parallel insert. Extracting the shared writer is step 0 of the bridge.

### Migration order

0. Extract a shared canonical care-action writer from the three scattered `care_action_cards` insert sites (rule #8).
1. Build `memo → candidate/review → care_action_cards` bridge for ambiguous input; route structured manual input through the shared writer + existing confirm step (rule #5).
2. Tests proving both manual clinic-update paths (ambiguous and structured) create confirmed `care_action_cards` only after user confirmation.
3. Migrate `/partner/[token]` read to `care_action_cards`.
4. Migrate `/calendar` and schedule API through a compatibility/projection layer.
5. Deprecate direct `schedule_items` primary usage.

## Consequences

### Easier
- Manual post-visit logging (the dominant intent) becomes partner-visible and reminder-eligible.
- Partner View / today execution read one confirmed reality.
- Confirmation-first invariant holds across both logging lanes.

### Harder
- The clinic-update write path must grow a candidate/confirm step instead of a direct schedule insert.
- Partner read migration is gated on the write bridge landing first (slower terminal-step payoff).

### Prohibited
- Migrating partner/calendar read to `care_action_cards` before the manual write bridge exists.
- Auto-projecting `schedule_items` into `care_action_cards` without a user confirm step.
- Adding new manual-logging features that write `schedule_items` as their canonical target.
- Creating a new direct `care_action_cards` insert path (e.g. `/api/clinic-update` structured confirm inserting cards itself) instead of reusing the shared canonical writer.
- Routing structured manual input through `split_candidates` as obligatory ceremony, which blurs `split_candidates`' meaning as the source-text parsing layer.

## Related

- ADR 0013 — confirm spine canonical (migrated the photo lane only; this ADR extends it to manual memo).
- ADR 0026 — Care Agent / concern-triage front door (the + entry that routes into this logging flow).
- CONTEXT.md — "Schedule item", "Care action card".
- #433 — locked product spine.
