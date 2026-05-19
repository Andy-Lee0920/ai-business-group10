# ADR 0013 — Confirm spine canonical: photo/OCR flow attaches to care_action_cards

## Status

Accepted — 2026-05-19

## Context

ADR 0003 already established `care_action_cards` as the canonical executable care action surface for SLC. Since then, an OCR/photo onboarding lane has been added in parallel:

- `app/api/onboard/photo-upload/route.ts` and `app/api/onboard/photo-analyze/route.ts` write extracted candidates into a separate `schedule_candidates` table.
- Confirmed schedule items from that lane live in `schedule_items` and are read directly by `app/(authed)/home/page.tsx` and rendered by `src/features/today/today-screen.tsx`.

Meanwhile, the canonical Fevio spine continues to use:

- `app/api/capture/route.ts` → `split_candidates`
- `app/api/onboard/candidates/confirm/route.ts` → `care_action_cards`
- Partner View (`src/services/partner-view.ts`), Web Push reminder (`src/lib/web-push-reminder-pusher.ts`), and PRD/SLC core all read confirmed `care_action_cards`.

Two parallel candidate-and-confirmed pairs now coexist:

| Lane | Candidate table | Confirmed table | Consumed by |
|---|---|---|---|
| Onboarding photo/text OCR | `schedule_candidates` | `schedule_items` | `/home` (TodayScreen, currently) |
| SLC capture → confirm | `split_candidates` | `care_action_cards` | Partner View, Web Push reminder, PRD core |

This bifurcation is invisible to the user today because `/home` reads only the legacy lane, but it will become user-visible the moment MVP requires sharing a photo-extracted action with the partner or sending a push reminder for it. Without consolidation, the photo lane produces data that the partner/reminder spine cannot see.

## Options compared

| Option | Shape | Sharing/reminder reach | Migration cost | Risk |
|---|---|---|---|---|
| A. Promote `schedule_items` to canonical | Migrate partner view and reminder to read `schedule_items`, drop `care_action_cards`. | Breaks ADR 0003 and existing tested spine; partner sanitization rules and `revision`/`superseded_by` semantics would need re-implementation. | Very high. | Reverses earlier accepted decision, throws away tested RLS/projection contracts. |
| B. Keep both lanes permanently | Route photo flow to `schedule_items`, manual flow to `care_action_cards`. | Partner/reminder must merge two tables; every consumer doubles in complexity. | Continuous tax on every new feature. | Drift, bugs, doubled test surface. Concretely violates CLAUDE.md anti-pattern §1 (demo flags / parallel lanes inside domain). |
| C. Attach photo lane to canonical spine | photo-analyze produces `split_candidates`; confirm step produces `care_action_cards`. Migrate `/home` reader to `care_action_cards`. | Single source of truth for partner, reminder, and home. | One-time migration of OCR write path and home reader; `schedule_items` retained as legacy fallback during transition. | Mid-effort: requires #376 to expand scope and #385 to depend on the new home reader. |

## Decision

Adopt **Option C**: the photo/OCR/AI onboarding lane attaches to the canonical confirm spine. All confirmed executable care tasks live in `care_action_cards`.

### Concrete rules

1. **Canonical confirmed table**: `care_action_cards` is the single canonical executable care action surface. `schedule_items` is legacy/SLC compatibility only and must not be the write target for new flows.
2. **Canonical candidate table**: `split_candidates` is the canonical candidate surface. New OCR/AI/photo flows write candidate drafts here, not into `schedule_candidates`.
3. **Photo flow integration**: `photo-upload → photo-analyze → candidate review → user confirm (owner/type/time) → split_candidates + care_action_cards`. AI output remains advisory; ownership/type/safety still come from the user (preserves PRD invariant).
4. **Home reader migration**: `/home` (`app/(authed)/home/page.tsx`) and `TodayScreen` must read `care_action_cards` as primary source. `schedule_items` may be retained as a temporary fallback projection only.
5. **Legacy code freeze**: do not add new features against `schedule_candidates` or `schedule_items`. Existing writers may continue functioning during transition, but no new feature surface depends on them.

### Issue mapping

- **`#376-A`**: photo-analyze / text-analyze write candidate drafts to `split_candidates`; confirm step creates `care_action_cards`.
- **`#376-B`**: `/home` and `TodayScreen` switch to `care_action_cards` as primary read source; `schedule_items` becomes optional fallback.
- **`#385`** (Today Home density): pure UX/density work on top of the migrated reader. Does not own data-model migration.

## Consequences

### Easier

- One canonical confirmed-action table for partner view, reminder, home.
- Photo-extracted actions become shareable to partner and reminder-eligible by default.
- Test surface shrinks: one RLS contract, one projection, one reminder window resolver.
- New OCR/AI/photo flows do not require parallel sanitization or partner-projection logic.

### Harder

- `#376` scope grows: it now includes confirm-step integration, not just OCR extraction.
- `/home` migration (`#376-B`) must preserve current visible behavior during transition. A read fallback to `schedule_items` is allowed during the swap, but no new write path.
- `TodayScreen` currently consumes `ScheduleItem`; a projection from `care_action_cards` to `ScheduleItem`-compatible shape is required, or the consumer must be updated.

### Prohibited

- Do not add `schedule_items` write paths for new OCR/AI/photo features.
- Do not introduce demo/onboarding mode flags inside domain logic to route between the two tables (CLAUDE.md anti-pattern §1).
- Do not promote `schedule_candidates` into a long-lived canonical model.
- Do not split future issues by UI variant when the underlying data contract is what differs (CLAUDE.md anti-pattern §2).

## Follow-up criteria for revisiting

Open a follow-up ADR only if:

1. `care_action_cards` proves unable to express photo-extracted schedule semantics that cannot be added as columns.
2. A measured performance reason emerges to keep a separate fast-read schedule projection.
3. `#44` Clinic Schedule introduces a recurrence-template entity that does not fit ADR 0003's escape hatch.

## Related

- ADR 0003: `docs/04-decisions/0003-schedule-model.md` (this ADR extends it)
- CLAUDE.md anti-patterns §1, §2
- `docs/01-product/mvp-target.md` — MVP definition (photo input is P0)
- `docs/03-engineering/schema-rls-matrix.md`
- Issue: `#376` (to be split into `#376-A` and `#376-B` per this ADR)
