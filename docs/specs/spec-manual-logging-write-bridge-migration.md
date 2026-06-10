# Spec — Manual logging write bridge & care_action_cards consolidation (#433 child)

> **Status:** DRAFT for review before posting to GitHub. Code by Codex/Claude Code after approval.
> **Parent:** #433 (locked product spine)
> **Decision source:** ADR 0028 (extends ADR 0013). Do not relitigate the decisions here — this spec only sequences their execution.

## Goal

Turn the ADR 0028 decision into executable tracer-bullet vertical slices. The locked spine is:

```
post-visit clinic logging → confirmed care action → today execution → partner-safe behavior prompt
```

Today the canonical confirmed-action table `care_action_cards` is fed **only** by the photo/text candidate flow. Manual logging (`ClinicUpdateForm` → `/api/clinic-update`) writes `schedule_items` (legacy) and never reaches canonical. This spec makes manual logging produce canonical `care_action_cards`, then migrates readers — **producer before consumer**.

## Invariants (must hold across every slice)

- Manual P0 works without LLM.
- Executable `care_action_cards` are created **only** on explicit user confirm (confirmation-first).
- No new direct `care_action_cards` insert path outside the shared canonical writer.
- `schedule_items` is never the canonical meaning source for new manual logging.
- Partner view renders only projection/allowlisted fields, never raw card detail or free text.
- RLS isolates couple-scoped data.

---

## Slice 0 — Extract shared canonical care-action writer

**Why:** `care_action_cards` inserts are scattered across `app/api/onboard/candidates/confirm/route.ts`, `app/api/schedule/complete/route.ts`, and `src/lib/sensitive-care-write.ts`. Without one writer, the new structured-confirm path becomes a 4th parallel insert (ADR 0028 rule #8).

**Do:**
- Extract one shared writer (e.g. `createConfirmedCareAction`) that all three existing sites call.
- No behaviour change for existing flows.

**Green:**
- All three existing call sites route through the shared writer.
- Existing unit/integration tests stay green; add a test asserting the writer is the only insert path for `care_action_cards`.

---

## Slice 1 — Ambiguous manual memo bridge

**Why:** Free-text / photo / text-paste logging must enter the canonical spine (ADR 0028 rules #1, #5a).

**Do:**
- Route ambiguous manual input through `visit_inputs → action_split_drafts → split_candidates → user confirm → care_action_cards` (reuse `src/lib/capture-confirm-store.ts`).
- Forbidden: new `care_action_candidates` model; `clinic_updates`/`schedule_items`-only write for new path.

**Green (URL-action-result):**
- `/clinic-update`에서 사용자가 자유 메모를 입력하고 confirm 했을 때, 그 항목이 `care_action_cards`로 저장되고 `/home`에서 confirmed 카드로 보인다.
- `visit_inputs`에 원문이 evidence로 남는다.

---

## Slice 2 — Structured manual confirm bridge

**Why:** Structured input (medication/dose/days/time picker) has no parsing ambiguity, so it bypasses `split_candidates` but still needs canonical write + ownership decision (ADR 0028 rules #5, #7).

**Do:**
- Structured manual input → `visit_inputs` provenance → existing confirm step → **shared writer** → `care_action_cards`. Skip `split_candidates`.
- Confirm step collects: `assignee_role` (default `primary_user`), `partner_visible` (default `false`).
- Per-card opt-in toggle, behaviour-framed copy ("파트너가 도울 일로 만들기"). No `partner_prompt` free text.
- Apply `description-content-rules.md` warning badges at confirm (warn, not block).

**Green (URL-action-result):**
- `/add`에서 사용자가 약·용량·시간을 입력하고 confirm 했을 때, `split_candidates` 없이 `care_action_cards`가 생성되고 기본값은 private(`partner_visible=false`)이다.
- 파트너 공유 토글을 켜야만 `partner_visible=true` / `assignee_role`가 `partner`·`both`가 된다.

---

## Slice 3 — Partner read migration

**Why:** Terminal spine step. Partner view currently reads `schedule_items`; the projection service already accepts `CareActionCard[]`, so this is a source swap, not a rebuild (ADR 0028 step 3).

**Do:**
- `/partner/[token]` reads `care_action_cards` (not `schedule_items`).
- Reuse `translateCareCardToPartnerRole`, `serializePartnerViewCards`, `PARTNER_VIEW_ITEM_FIELDS`, `partner_visible` gate.

**Green (URL-action-result):**
- `/partner/[token]`에서 파트너가 링크를 열었을 때, 사용자가 confirm한 `care_action_cards`가 projection policy를 거친 role prompt로 보인다.
- `partner_visible=false` 카드는 파트너 화면에 나타나지 않는다.
- raw card detail·자유텍스트는 렌더링되지 않는다.

---

## Slice 4 — Calendar / schedule API compatibility

**Why:** Remaining canonical readers (ADR 0028 step 4).

**Do:**
- `/calendar` and schedule API read `care_action_cards` or a derived schedule projection with clear ownership.
- `schedule_items` becomes legacy fallback / derived projection only.

**Green (URL-action-result):**
- `/calendar`에서 사용자가 일정을 열었을 때, `care_action_cards`(또는 그 파생 projection) 기준으로 home·partner와 동일한 confirmed 현실을 본다.

---

## Slice 5 — schedule_items deprecation plan

**Do:**
- Forbid direct primary writes to `schedule_items`.
- Map remaining read/write sites; define removal-or-compatibility window.
- **`clinic_updates` table fate:** decide retire vs. reduce to a structured projection of `visit_inputs`. Converge the manual raw store onto `visit_inputs` (no parallel raw lane).

**Green:**
- No code path writes `schedule_items` as a canonical/primary target for manual logging.
- A documented map of every remaining `schedule_items` / `clinic_updates` reference with its disposition.

---

## Acceptance criteria (epic-level)

- Manual clinic logging produces confirmed `care_action_cards` after explicit user confirmation.
- Structured manual input produces confirmed `care_action_cards` after explicit confirm **without** `split_candidates`.
- Duplicate confirm cannot create duplicate `care_action_cards`.
- Partner view sees canonical `care_action_cards` through projection policy; `partner_visible=false` cards never appear.
- No new direct `care_action_cards` insert path outside the shared writer.
- `schedule_items` is no longer the canonical meaning source for new manual logging.
- Tests cover: shared writer, manual memo bridge, structured confirm, partner projection, duplicate confirm.

## Out of scope / follow-up

- **Separate follow-up issue recommended:** `care-agent-client` hardcoded `confirmedPhase: 'ovarian_stimulation'` / `phaseCareDay: 'injection_day'` placeholders (CLAUDE.md "no placeholders"). Independent of the write bridge.
- `card_type`-based sharing auto-recommendation (ADR 0028 rule #7 — deferred).
- User-authored partner messages with moderation (ADR 0028 rule #7 — out of v0).

## References

- #433 — locked product spine
- ADR 0013 — confirm spine canonical (photo lane)
- ADR 0026 — Care Agent / concern-triage front door
- ADR 0028 — manual logging write bridge; producer before consumer
- `CONTEXT.md` — "Visit input", "Split draft", "Split candidate", "Care action card", "Schedule item", "Care Agent"
- `src/lib/capture-confirm-store.ts`
- `src/domain/partner-role-projection.ts`
- `src/services/partner-view.ts`
- `docs/specs/description-content-rules.md`
