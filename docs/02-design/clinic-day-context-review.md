# ClinicDay Patient Context Review Surface

Status: Execution brief for #140, amended by ADR 0010.

## Goal

ClinicDay should feel like a calm context review the patient can review in the waiting room before the appointment, not a doctor-facing AI mediation surface or an InjectionDay variant with green copy.

The job is to help the patient remember what happened since the last clinic visit: medication/injection execution, symptoms or condition notes, previous instructions, and the current confirmed cycle context.

## First viewport composition

1. Eyebrow/slot label: `오늘 확인할 핵심`
2. Dynamic title examples:
   - `바뀐 약과 주사를 먼저 말해요`
   - `몸 상태 변화를 빠뜨리지 않아요`
   - `다음 일정이 바뀌었는지 확인해요`
   - `지난 방문 이후 바뀐 것`
3. Fact line: `지난 7일 케어 기록 · 약/주사 확인 · 다음 안내 기록`
4. Primary action follows the focus package: `다음 안내 확인하기`, `약·주사 확인하기`, or `몸 상태 확인하기`
5. Hero content: the modules that match the title, not generated medical advice.

## Focus-package rule

The title and modules are selected together. They are a set in the user experience, but separate in implementation: the focus package chooses which existing module appears first, while timeline, medication, symptom, and instruction-capture modules remain independent components.

## Context review before visit

- Last clinic visit and current visit date.
- Timeline of confirmed care events since the last visit.
- Medication/injection completion or missed/delayed items recorded by the user.
- User-selected symptoms or condition notes.
- Previous clinic instructions and completion status.
- Current confirmed cycle day / phase when known.
- Optional visualization: timeline, medication adherence strip, follicle-size table, or medication change graph when it improves recall.

## Capture contents after visit

After the visit, offer structured capture for confirmed clinic instructions:

- Follicle count/size, if the user chooses to enter it.
- Medication change.
- Next visit date.
- Trigger/retrieval/transfer/freeze-all/repeat-test decision.
- Precautions or follow-up instructions.

These become draft CycleEvent candidates and require user confirmation before they can update phase.

## Partner role

Partner reads as `동행자` or `기록 도우미`, with two or three concrete actions only: 이동 시간 확인, 접수/귀가 동선 돕기, 진료 후 다음 일정 함께 기록.

## State-driven Generative UI boundary

State-driven Generative UI decides which fixed context module is most useful for this visit. It may reorder timeline, medication, symptom, graph, appointment, and capture modules from confirmed records.

It must not generate doctor-facing advice, judge whether clinic information is correct, infer treatment strategy, or use an LLM conversation as the core ClinicDay workflow.

## Boundaries

No LLM medical judgment, no medical recommendation generation, no doctor portal, no EHR export, no treatment strategy inference, and no phase transition from unconfirmed clinic-note drafts.

## URL verification

- `/home?care=clinic`: reviewer understands “review my recent care context before the clinic visit” within three seconds.
- `/demo` clinic step: partner role reads as logistics/recording support, not raw projection or doctor-facing advice.
