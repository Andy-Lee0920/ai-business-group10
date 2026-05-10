# ADR 0003 — Schedule model stays on care action cards for SLC

## Status

Accepted — 2026-05-10

## Context

Issue `#55` is the decision gate between the SLC card model (`#25`) and P1 Clinic Schedule (`#44`). The product origin names schedule management as a core pain: clinic visits are frequent, irregular, have different purposes, and often change on the same day (`docs/01-product/original-note-hyunjoo.md` §1, §5-1). It also points to later protocol automation: prescription input can generate a calendar-like sequence (`§6-3`).

The current PRD v1.0 data model already represents user-confirmed actions in `care_action_cards`, including `card_type = 'clinic_visit'`, `scheduled_at`, `care_date`, `status`, `revision`, `superseded_by`, and partner visibility. The schema/RLS matrix keeps `care_action_cards` as the P0 card/home surface owned by `#25 / #24`, with partner access only through a sanitized server projection.

ADR 0001 constrains the first proof to a small manual-first SLC. ADR 0002 adds P0 emphasis for time-sensitive injection cards and partner-action visibility, but explicitly keeps medical judgment out of stored DB safety fields.

The decision here is not whether Fevio eventually needs richer schedule concepts. It is which model should be adopted before SLC so `#25` can proceed without creating avoidable P1 migration debt for `#44`.

## Options compared

| Option | Shape | P1 `#44` repeated schedules / same-day changes | RLS impact | Index impact | Partner view impact | SLC fit | Main risk |
|---|---|---|---|---|---|---|---|
| A. Single model | Use only `care_action_cards.scheduled_at`, `care_date`, `status`, and `card_type = 'clinic_visit'`. Changes create updated/superseded cards. | Simple enough for P0 and early P1 if each visible visit instance is a confirmed action card. Same-day changes reuse the existing `revision` / `superseded_by` / `status` pattern. Repetition is represented as multiple confirmed cards, not a recurrence rule. | No new table or policy. Existing couple-scoped card RLS and server-filtered partner projection remain the only access surface. | Existing `care_action_cards` date/type indexes cover home, clinic day, and partner view queries. | No new payload shape; partner can see only whitelisted fields from confirmed partner-visible cards. | Best. Matches manual-first SLC and avoids schema work in this ADR. | If P1 needs recurrence templates, cancellation history, or clinic-resource metadata, card rows alone may become overloaded. |
| B. Separate model | Add `clinic_visits` and connect cards through `care_action_cards.visit_id`. | Cleanest domain boundary for recurring schedules, visit-level cancellation/reschedule audit, and future calendar UI. Same-day changes can update visit state while preserving action cards. | Requires new couple-scoped RLS policies and server projection rules. More tables must respect Privacy Gate and partner-token constraints. | Requires new visit date/status indexes plus join-aware card indexes. | Partner view must decide whether it exposes visit fields, card fields, or a merged projection; this expands contract-test surface. | Weak for SLC. Adds migration and policy work before the first manual card loop is proven. | Premature abstraction: `#25` and `#44` would both need to coordinate on an unvalidated entity. |
| C. Stage it | Ship SLC with Option A, then migrate to Option B in P1 if `#44` acceptance proves recurrence/reschedule concepts need a visit entity. | Keeps P0 simple while reserving a clear migration path. Repeated schedules start as generated card instances; P1 can introduce `clinic_visits` only when recurrence/audit semantics are concrete. | P0 has no new RLS. P1 migration can add one policy set with real access requirements from `#44`. | P0 uses existing indexes. P1 adds visit indexes only if needed. | P0 partner view stays stable. P1 can preserve the same partner payload while changing internal storage. | Best overall. It is Option A now with an explicit P1 escape hatch. | Requires discipline: do not encode recurrence-specific semantics into ad hoc card fields before `#44` decides them. |

## Decision

Adopt **Option C: SLC uses the single `care_action_cards` schedule model, with a P1 migration gate to `clinic_visits` only if `#44` proves it is needed**.

For SLC and `#25`:

- A clinic visit is a `care_action_cards` row with `card_type = 'clinic_visit'`.
- `scheduled_at` stores the user-confirmed visit time when known.
- `care_date` supports day-level home grouping even when exact time is unknown.
- Same-day changes are represented by updating the confirmed card or creating a revised card using the existing `revision`, `superseded_by`, and status values (`superseded`, `revoked`, `archived`) according to the card-model rules.
- Repeated clinic schedules are represented as separate confirmed card instances for now; no recurrence rule or schedule template is introduced in P0.

For P1 and `#44`:

- `#44` may propose `clinic_visits` only when it has concrete acceptance criteria that are hard to express as confirmed card instances, such as recurrence templates, visit-level cancellation history, clinic protocol generation, or calendar-specific aggregation.
- If `clinic_visits` is introduced later, preserve `care_action_cards` as the executable home/partner action surface. `clinic_visits` may become the schedule source, but partner view should continue to expose a sanitized action-card projection unless a new ADR changes that contract.

## Consequences

### Easier

- `#25` can implement the P0 card model without waiting for schedule-table design.
- RLS remains narrow: couple-scoped card access plus server-filtered partner projection.
- Home and partner queries can use the PRD §15 `care_action_cards` indexes.
- Same-day visit changes use the same revision/supersession language as other action cards.

### Harder

- P0 does not get native recurrence rules.
- P0 cannot answer advanced calendar questions such as "show the original appointment before two same-day reschedules" unless card history is modeled carefully.
- `#44` must avoid assuming a dedicated visit entity until it has a tested reason.

### Prohibited for SLC

- Do not add `clinic_visits`, `visit_id`, recurrence-rule columns, or clinic-calendar migrations in `#55` / `#25`.
- Do not add UI for a calendar or clinic schedule manager in this ADR.
- Do not expose raw visit input text or unconfirmed schedule text through partner view.
- Do not store medical/safety judgments as schedule-model fields.

## Follow-up criteria for revisiting

Open a P1 ADR or migration proposal from `#44` only if at least one of these becomes accepted scope:

1. Recurrence templates need to be edited independently from generated action cards.
2. Same-day reschedule/cancel audit must be preserved as visit-level history rather than card revision history.
3. Protocol automation from `original-note` §6-3 needs a schedule source that generates many cards over time.
4. Calendar UI needs visit-level grouping that cannot be derived from `care_action_cards` without duplicating semantics.

## Related

- Issue: `#55` — `[ADR] 일정 모델 결정 — care_action_cards.scheduled_at 단일 vs visits 테이블`
- Parent gates: `#25`, `#44`
- Product origin: `docs/01-product/original-note-hyunjoo.md` §1, §5-1, §6-3
- Data model: `docs/01-product/prd-v1.0.md` §12.7, §15
- RLS matrix: `docs/03-engineering/schema-rls-matrix.md`
- ADR 0001: `docs/04-decisions/0001-slc-first-manual-first.md`
- ADR 0002: `docs/04-decisions/0002-p0-boost-rules.md`
