# Fevio Gold Screen Contracts

These contracts are the execution layer for the benchmark pack. They are stricter than visual inspiration.

A phase is not a theme. A phase is a different care job.

## Global failure rules

A PR fails if:

- Injection / Clinic / Waiting share the same top-level component order.
- The only visible difference is color, icon, or copy.
- The first fold contains a dense grid or three or more cards.
- The partner screen mirrors raw patient data.
- The screen exposes engineering terms such as `rev`, `sync_revision`, `LIVE SYNC`, `signalGrid`, `Dynamic Home`, or placeholder copy.
- A deployed URL does not demonstrate the expected role/action/result.
- Medical copy suggests dosage decisions, missed-shot judgment, or diagnosis beyond hospital instructions.

## 1. Injection Patient

**Dominant object:** Care Moment Ring / time instrument.

**First fold must show:**

- `21:00` as the largest text or dominant numeric object.
- `고날에프 주사` or confirmed medication name from hospital instruction.
- One primary CTA: `주사 준비 시작` or `준비물 확인하기`.
- Ring/countdown occupying the visual center of gravity.

**Scroll boundary:**

- Checklist, partner presence, and detail cards appear after the first fold.

**Forbidden above first fold:**

- More than one primary CTA.
- Dense grid.
- Generic progress badge as the dominant object.
- Partner pulse above the time/ring instrument.
- Three or more cards.

**Green condition:**

Visit `/home?care=injection`. The first viewport makes the user understand “when, what injection, what to prepare now” within 3 seconds.

## 2. Injection Partner

**Dominant object:** Co-check mission.

**First fold must show:**

- Role: `확인자` or `준비 지원자`.
- Mission title: `같이 확인할 것`.
- 3 co-check items maximum:
  - 준비물,
  - 보관 상태,
  - 투약 시간/부위.
- One CTA: `함께 확인 완료`.

**Forbidden above first fold:**

- Emotional support card before factual co-check items.
- Raw mirrored patient data.
- Revision/sync internals.
- Full patient card list.

**Green condition:**

Visit `/partner/demo` or `/demo` injection partner view. The partner understands the concrete co-check mission within 3 seconds.

## 3. Clinic Patient

**Dominant object:** Clinical briefing document.

**First fold must show:**

- Eyebrow: `진료 준비`.
- Title: `오늘 진료실에 가지고 갈 것들`.
- Facts:
  - `질문 2개`,
  - `지난 7일 케어 기록`,
  - `파트너 동행`.
- One CTA: `진료 브리핑 열기`.

**Hero content:**

- Numbered briefing list can occupy the hero area.
- It should feel like a calm document, not a dashboard.

**Scroll boundary:**

- Questions to ask.
- Last 7 days care execution summary.
- Medication/injection record summary.
- Symptom or memo chosen by the patient.
- Next instruction capture / photo memo affordance.

**Forbidden above first fold:**

- Injection-style dominant ring/countdown.
- Generic visit checklist as the main object.
- Share/status cards before briefing.
- Dense utility grid.

**Green condition:**

Visit `/home?care=clinic`. A reviewer understands “bring this into the clinic visit” within 3 seconds.

## 4. Clinic Partner

**Dominant object:** Companion mission briefing.

**First fold must show:**

- Role: `동행자` or `기록 도우미`.
- Departure or visit timing.
- 3 actions maximum:
  - 출발 시간 확인,
  - 챙길 것 확인,
  - 같이 말할 질문 확인.
- One CTA: `동행 준비 완료`.

**Forbidden above first fold:**

- Full mirrored patient briefing.
- Raw memo text unless intentionally shared and transformed.
- Emotional judgement.
- Generic “partner support” text without concrete action.

**Green condition:**

Visit `/demo` clinic step. The partner view reads as companion/logistics support, not a raw projection.

## 5. Waiting Patient

**Dominant object:** Space + one sentence.

**First fold must show:**

- A quiet central sentence, for example: `지금은 몸과 마음을 쉬어도 되는 시간이에요`.
- One required fact: `판정일까지 D-5` or next required appointment.
- Optional low-pressure action: `오늘 상태 남기기` only if visually demoted.

**Layout requirement:**

- Whitespace is the intervention.
- Component count above fold must be lower than InjectionDay and ClinicDay.

**Forbidden above first fold:**

- Progress dashboard emphasis.
- Loud checklist grid.
- More than one CTA.
- Urgency language.
- Repeated “checking” affordances.

**Green condition:**

Visit `/home?care=waiting`. The user understands “I do not need to optimize more right now” within 3 seconds.

## 6. Waiting Partner

**Dominant object:** Quiet support.

**First fold must show:**

- Role: `조용한 지지자` or equivalent.
- Primary instruction: `오늘은 조용히 곁에 있어주세요`.
- 2–3 support actions maximum:
  - 일정 보기,
  - 응원 한마디 보내기,
  - 병원 연락 기준 확인.

**Forbidden above first fold:**

- Asking for symptoms as the main action.
- Raw emotion score.
- “불안 80%” style surveillance language.
- Many tasks that make waiting feel like work.

**Green condition:**

Visit `/demo` waiting partner view. The partner understands “do not ask; be present; know when hospital contact matters” within 5 seconds.
