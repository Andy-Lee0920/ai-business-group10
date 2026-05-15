# Clinic Guide IA boundary

Session 0 issue: [#276](https://github.com/Andy-Lee0920/ai-business-group10/issues/276)

This document fixes the product boundary between three similar flows before implementation starts. It is intentionally narrow: it decides where each flow belongs, what each flow may persist, and where AI/input assist is allowed.

## Decision summary

| Flow | Primary route / entry | User moment | Primary purpose | Persisted source | AI/input assist boundary |
| --- | --- | --- | --- | --- | --- |
| First Schedule Interview | `/onboarding` after patient consent; optionally `/home?onboarding=true` | First-time setup before the home screen has useful schedule data | Create the first visible schedule item(s) for Home | `schedule_items.source = 'onboarding_interview'` | Optional input assist only; must not save without confirmation |
| Clinic Update | `/clinic-update`; Home follow-up banner after clinic visit | After a clinic visit changed instructions | Record clinic changes and reflect user-confirmed updates | `clinic_updates`; optional `schedule_items.source = 'clinic_update'` | Adaptive review can draft questions/summary; must not infer treatment decisions or auto-save |
| Manual Add | `/add`; Home plus button | User already knows the item they want to add | Fast direct schedule entry | `schedule_items.source = 'manual'` | No conversational AI; medication search/filter is allowed |

## First Schedule Interview

### Product role

First Schedule Interview prepares the user's first Home experience. It owns the reference-style screen that says, in effect, "오늘 화면을 준비할게요." This is not a post-clinic review screen.

### Entry points

- Primary: after patient consent in onboarding.
- Secondary: `/home?onboarding=true` if the product needs to resume or show the setup affordance.
- Skip path: "나중에 할게요" returns the user to Home without writing schedule data.

### Responsibilities

- Ask for the first schedule item type: injection, medication, or clinic.
- Let the user select/search medication when applicable.
- Let the user choose or enter time.
- Show a confirmation screen before persistence.
- Persist only after the confirmation CTA.

### Data writes

- Writes `schedule_items` only after user confirmation.
- Must use `source = 'onboarding_interview'`.
- Must not create `clinic_updates`.

### Related issues

- [#246](https://github.com/Andy-Lee0920/ai-business-group10/issues/246) — onboarding state machine
- [#248](https://github.com/Andy-Lee0920/ai-business-group10/issues/248) — `onboarding_interview` source migration
- [#256](https://github.com/Andy-Lee0920/ai-business-group10/issues/256) — deterministic interview UI
- [#279](https://github.com/Andy-Lee0920/ai-business-group10/issues/279) — medication search and direct input
- [#257](https://github.com/Andy-Lee0920/ai-business-group10/issues/257) — confirmation and save
- [#260](https://github.com/Andy-Lee0920/ai-business-group10/issues/260) — optional input assist

## Clinic Update

### Product role

Clinic Update is a post-visit review/update flow. It answers: "병원에서 바뀐 내용을 오늘 일정에 어떻게 반영할까요?"

It must not be used as the first onboarding schedule setup screen.

### Entry points

- `/clinic-update`
- Home clinic follow-up prompt after a clinic visit has passed

### Responsibilities

- Capture user-confirmed changes after a clinic visit.
- Ask adaptive follow-up questions when the user input is incomplete.
- Summarize draft changes for user confirmation.
- Persist only after the user confirms.

### Data writes

- Writes `clinic_updates` after confirmation.
- May create/update `schedule_items` after confirmation.
- Any schedule item generated from this flow must use `source = 'clinic_update'`.
- Must not use `source = 'onboarding_interview'` or `source = 'manual'`.

### AI boundary

Adaptive AI may:

- decide the next clarifying question;
- summarize user-provided facts;
- identify missing fields;
- draft a confirmation summary.

Adaptive AI must not:

- infer dosage, trigger timing, medication strategy, diagnosis, or treatment stage;
- turn uncertain text into executable instructions;
- save anything without explicit user confirmation;
- expose OpenRouter or service credentials to the browser.

### Related issues

- [#244](https://github.com/Andy-Lee0920/ai-business-group10/issues/244) — adaptive clinic review loop
- [#249](https://github.com/Andy-Lee0920/ai-business-group10/issues/249) — clinic-guide-ai Edge skeleton
- [#264](https://github.com/Andy-Lee0920/ai-business-group10/issues/264) — legacy clinic update/manual add slice

## Manual Add

### Product role

Manual Add is the fast path for users who already know exactly what they want to add. It should feel direct, not conversational.

### Entry points

- `/add`
- Home plus button

### Responsibilities

- Select item type.
- Search/filter medication when applicable.
- Enter date/time and optional dose/unit.
- Save after an explicit submit action.

### Data writes

- Writes `schedule_items` after submit.
- Must use `source = 'manual'`.
- Must not create `clinic_updates`.

### AI boundary

- No conversational AI in the P0 manual add path.
- Medication search, filtering, aliases, and direct input rows are allowed.
- No hidden background writes.

## Cross-flow invariants

These rules apply to all three flows.

1. User confirmation is required before persistence.
2. AI/input assist can only draft or clarify; it cannot save.
3. AI/input assist cannot provide medical advice, dosage inference, trigger timing, diagnosis, or treatment strategy.
4. OpenRouter and Supabase privileged secrets must stay server-side only.
5. RLS/user ownership boundaries remain in force for every query and write.
6. Supabase raw errors must not be exposed directly to users.
7. Partner read-only surfaces must not expose raw clinic notes or private draft text.
8. Issue [#228](https://github.com/Andy-Lee0920/ai-business-group10/issues/228) remains out of scope for this IA cleanup.

## Implementation sequencing

### Before feature implementation

1. Close duplicate reopened implementation issues through [#281](https://github.com/Andy-Lee0920/ai-business-group10/issues/281).
2. Keep this IA document as the authoritative route/source boundary.
3. Treat [#259](https://github.com/Andy-Lee0920/ai-business-group10/issues/259) as the illustration-system parent before child asset tasks are implemented.

### Goal Session A: onboarding and first schedule

- #246, #247, #248
- #252, #253, #254, #255
- #256, #279, #257
- #249, #260

### Goal Session B: core surfaces and clinic review

- #261, #268, #270
- #263, #269, #251, #289
- #244
- #277, #258, #265
- #278, #259, #280

## Stop conditions

Session 0 is complete when:

- duplicate reopened issues are closed or marked canonical;
- this IA document exists;
- #276 points to this IA document;
- #259 is the canonical illustration-system parent;
- #282~#297 are not treated as independent pre-architecture implementation tasks.
