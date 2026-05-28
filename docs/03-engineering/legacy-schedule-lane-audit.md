# Legacy schedule lane audit

Generated: 2026-05-20

ADR 0013 canonical spine: `split_candidates → care_action_cards`.
Legacy lane: `schedule_candidates` and `schedule_items` remain compatibility surfaces until their readers/writers are migrated or intentionally retired.

## Current table classification

| Table | Classification | Notes |
| --- | --- | --- |
| `split_candidates` | canonical draft/candidate lane | Written by onboard text/photo analysis; read by onboard confirm. |
| `care_action_cards` | canonical executable care card lane | Written by confirm and care-input routes; read by home, partner projection, reminders; completion updates prefer this lane. |
| `schedule_candidates` | legacy/obsolete photo-candidate lane | Migration/table and account reset cleanup remain; no product write/read path currently found. |
| `schedule_items` | legacy schedule fallback lane | Still powers calendar/add/edit/clinic-update/records fallback and legacy completion records. Deep dependency; do not remove in one pass. |

## Read/write map

### Canonical candidate creation

- `app/api/onboard/photo-analyze/route.ts` — writes extracted image candidates to `split_candidates` after creating capture draft/input.
- `app/api/onboard/text-analyze/route.ts` — writes extracted text candidates to `split_candidates` after creating capture draft/input.
- `app/api/onboard/candidates/confirm/route.ts` — reads `split_candidates`, writes confirmed rows to `care_action_cards`, then marks first capture completed.

### Canonical care cards

- `app/(authed)/home/page.tsx` — reads `care_action_cards` first, then falls back to `schedule_items` only when no canonical cards exist.
- `app/(authed)/layout.tsx` — existing-care guard accepts either `schedule_items` or `care_action_cards`.
- `app/api/schedule/complete/route.ts` — updates `care_action_cards` first, falls back to `schedule_items` + `completion_records`.
- `app/api/medication/complete/route.ts` — updates `care_action_cards`.
- `app/api/prescription/capture/route.ts`, `app/api/medication/route.ts`, `app/api/emotion/route.ts`, `app/api/ivf-record/route.ts` — write `care_action_cards` from non-schedule care inputs.
- Reminder dispatch migrations and `/api/reminders/send-due` are keyed to `care_action_cards`.
- Partner projection migrations/functions join through `care_action_cards`.

### Legacy `schedule_items` readers/writers to keep temporarily

- Writers: `app/api/onboarding/route.ts`, `app/api/schedule/add/route.ts`, `app/api/clinic-update/route.ts`, migration seed helper.
- Readers: `app/(authed)/calendar/page.tsx`, `app/(authed)/records/page.tsx`, `app/(authed)/partner/page.tsx`, `app/(authed)/clinic-update/page.tsx`, `app/(authed)/add/page.tsx`, `app/(authed)/schedule/[id]/edit/page.tsx`, `app/api/schedule/route.ts`, `app/api/records/route.ts`, `app/api/schedule/[id]/route.ts`.
- Coupled legacy tables: `completion_records.schedule_item_id` references `schedule_items(id)`.

## FK/dependency notes

- `care_action_cards.split_candidate_id` references `split_candidates(id)` with `on delete set null`.
- `care_action_cards.source_input_id` references `visit_inputs(id)` with `on delete set null`.
- `completion_records.schedule_item_id` still references `schedule_items(id)` and blocks full retirement until completion history is migrated or mapped.
- `schedule_candidates` references `auth.users(id)` and is included in account reset cleanup only.

## Guard added

`tests/unit/legacy-schedule-lane-contract.test.ts` asserts:

- onboard text/photo analysis writes `split_candidates`, not `schedule_candidates` or `schedule_items`;
- onboard confirm writes `care_action_cards`, not `schedule_items`.

## Follow-up classification

| Area | Classification | Follow-up |
| --- | --- | --- |
| Photo/text onboarding | keep canonical | Guarded; no follow-up unless regression. |
| Home reader | keep current fallback | Already canonical-first; later remove fallback after data migration. |
| Manual add + clinic update writes | migrate | Child issue needed: write `care_action_cards` instead of `schedule_items`. |
| Calendar/schedule edit/API readers | migrate | Child issue needed: create canonical projection/API over `care_action_cards`. |
| Records page `schedule_items` read | migrate with #401 | Records journal/community rewrite should remove schedule reader entirely. |
| `schedule_candidates` table | retire later | Drop only after account-reset and deployed data audit. |
| `completion_records` | migrate later | Needs mapping to canonical card completion history. |

## Stop condition

The dependency is deep: `schedule_items` remains in calendar/manual-add/edit/records/clinic-update and `completion_records` FK. This audit intentionally stops before broad migration and leaves child migration issues rather than changing all readers/writers in one pass.
