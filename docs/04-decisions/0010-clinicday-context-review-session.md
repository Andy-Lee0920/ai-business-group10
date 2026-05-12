# ADR 0010 — ClinicDay is a care-context review session, not an LLM doctor mediator

## Status

Accepted — 2026-05-12

## Context

Q6 defines the IVF cycle as an evidence-confirmed state machine. A clinic visit is one of the strongest sources of evidence because the patient receives follicle status, medication changes, next visit dates, retrieval/transfer plans, cancellation decisions, or repeat-test instructions.

The risky interpretation is to make ClinicBrief an LLM conversation layer that judges whether clinic information is right, generates doctor-facing advice, or mediates the conversation with the doctor. That would increase complexity and create wrong-information risk in a sensitive medical context.

## Decision

ClinicDay is a **care-context review session** used in the clinic waiting room.

It helps the patient remember what happened since the last clinic visit so the real conversation with the clinician starts from a clear personal context. It does not tell the doctor what to do and does not judge medical correctness.

The model is:

```text
previous confirmed clinic/care events
  → deterministic context-review modules
  → user reviews context before visit
  → after visit, user captures confirmed instructions
  → structured clinic_note / CycleEvent candidates
  → user confirms before phase changes
```


## Dynamic focus package

ClinicDay does not use one fixed title. The generic visit-prep phrase is only a slot label. The visible headline should be the most important thing the patient needs to remember today.

```ts
type ClinicFocusPackage = {
  headline: string;              // e.g. “바뀐 약과 주사를 먼저 말해요”
  contextLine: string;
  primaryModule: 'medication_review' | 'condition_review' | 'schedule_review' | 'instruction_capture';
  supportingModules: Array<'timeline' | 'adherence_strip' | 'symptom_notes' | 'next_instruction_form'>;
};
```

The headline and components move as a set, but the components remain separately testable modules. A medication-focused headline should bring medication/adherence modules forward; a condition-focused headline should bring symptom notes forward; a schedule-focused headline should bring next-visit and instruction-capture modules forward.

## Before / after relationship

Fevio uses a connected ClinicDay session, but not an LLM Q&A loop.

### Before visit: Context review

Show only confirmed facts and user-entered observations since the last ClinicDay:

- timeline since last clinic visit;
- medication and injection completion summary;
- missed/delayed doses if user recorded them;
- symptoms or condition notes selected by the user;
- previous clinic instructions and whether they were completed;
- current cycle day / phase if already confirmed;
- optional visual graph or timeline when it improves recall.

### After visit: Capture

After the visit, Fevio offers fast structured capture for what the clinic actually said:

- follicle count/size only if user enters it;
- medication change;
- next visit date;
- trigger/retrieval/transfer/freeze-all/repeat-test decision;
- precautions or follow-up instructions.

These become draft `CycleEvent` candidates. They do not advance phase until confirmed by the user.

## Semi-generative scope

Semi-generative UI solves **which context-review modules to show for this visit**, not medical reasoning.

Allowed:

- choose timeline, medication adherence, symptom note, graph, appointment, or capture module based on confirmed records;
- change density and order by visit type;
- show patient-readable visualization such as injection adherence, visit timeline, follicle-size table, or medication change list;
- create draft structured fields from user-entered clinic notes only with confirmation.

Forbidden:

- no LLM medical correctness judgment;
- no treatment recommendation;
- no doctor-facing generated advice;
- no “ask your doctor this” generation as the primary product loop;
- no phase change from unconfirmed extraction;
- no raw private notes projected to partner.

## CycleEvent quality rule

ClinicDay can create reliable state-machine evidence only when each event stores source and confirmation state:

```ts
type ClinicEvidenceSource = 'user_context_review' | 'structured_capture' | 'clinic_note_draft';

type CycleEventDraft = {
  eventType: string;
  eventDate: string;
  source: ClinicEvidenceSource;
  confirmedByUser: boolean;
  sourceClinicSessionId: string;
};
```

Only `confirmedByUser: true` events may affect `confirmedPhase`.

## Consequences

### Easier

- ClinicDay stays useful without adding an unsafe LLM medical layer.
- Patients get recall support at the moment it matters: the waiting room before the visit.
- Cycle phase updates have better evidence because after-visit capture is structured.
- UI can vary by visit through deterministic semi-generative modules.

### Harder

- Fevio must model a ClinicDay session and connect pre-visit context review to post-visit capture.
- The app needs clear empty states when there is not enough confirmed history.
- Phase transition tests must prove unconfirmed clinic-note drafts do not advance the cycle.

### Forbidden

- Do not position ClinicBrief as a doctor-facing mediator.
- Do not make LLM judgment a requirement for ClinicDay.
- Do not generate medical questions or advice as the core ClinicDay value.
- Do not let clinic note extraction bypass explicit user confirmation.
