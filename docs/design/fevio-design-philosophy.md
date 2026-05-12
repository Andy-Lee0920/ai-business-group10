# Fevio Design Philosophy — Phase 0.5

Status: Phase 0.5 source of truth for issue `#123`.

Fevio is a **State-Based Care OS** for IVF couples. It is not a generic symptom tracker, a women-only calendar, a medical advice engine, or a motivational wellness app.

This document integrates the Deep Research material from `/Users/reliqbit_mac/Downloads/FEVIO_UX` and the latest product direction supplied on 2026-05-11 KST.

## 1. Product orientation: Care OS

Fevio exists to reduce the care gap outside the clinic and break the one-person “operations burden” of IVF.

Design implications:

- Every screen should answer: **what needs care now, who can do it, and what should not be exposed?**
- Patient screens focus on confirmed next actions, low cognitive load, and personal control.
- Partner screens translate patient state into supportive roles, not raw medical or emotional data.
- The home screen is state-based: injection day, clinic day, waiting day, and routine day should feel meaningfully different.

## 2. Language posture: restrained warmth

Fevio should be clear like a finance app, but warmer and safer because IVF is a high-vulnerability context.

Required tone:

- Validate first, then nudge.
- Use short Korean-first sentences.
- Prefer “함께 확인해요” over blame.
- Avoid toxic positivity, over-celebration, diagnosis-like language, and threat words.
- Use “잠시 연결이 불안정해요” rather than “실패했습니다.”

Forbidden patterns:

- “실패”, “치명적 오류”, “위험”, “잘못 입력했습니다.”
- Emotion scores exposed to partner: “우울함 80%.”
- Raw instruction transfer to partner without role translation.
- Counseling-like information panels that bury the demo value.

## 3. IVF journey model

| Phase | Clinical focus | Patient emotional state | Partner role in the OS |
| --- | --- | --- | --- |
| 과배란 유도 (COS) | 난포 성장, OHSS 예방 | 주사 공포, 신체 침해감, 복부 팽만 피로 | 준비 지원자: 주사 전 알코올 솜, 약물, 조용한 환경 준비 |
| 최종 성숙 (Trigger) | 34–36시간 골든타임, 투약 오류 방지 | 단 한 번의 실수에 대한 극도의 불안 | 타이머 감시자: 시간 이중 체크, 투약 환경 조성 |
| 난자 채취 (OPU) | 성숙 난자 확보, 합병증 체크 | 수술·마취 두려움, 신체적 통증 | 이동 동행자: 병원 동행, 시술 후 회복 케어 |
| 배아 배양 (Culture) | 수정률, 가드너 등급 평가 | 성적표를 기다리는 마음, 일희일비 | 정보 공동 수신자: 리포트를 함께 읽고 맥락 학습 |
| 이식 후 대기 (TWW) | 착상 유지, 황체기 보조 | 과각성, 희망과 절망 반복 | 정서적 지지자: 섣부른 질문 자제, 가사 전담, 곁 지키기 |

## 3.5 Semi-generative Care OS

Fevio uses **semi-generative UI**, not unconstrained generative UI. The system may adapt which approved component appears, which approved copy template is selected, and how phase-specific visuals are orchestrated. It may not invent medical facts, dosage, treatment urgency, or partner-visible scope.

Quotable product position:

> Fevio does not let AI draw arbitrary medical screens. It projects confirmed care context into strict layout slots, verified components, restrained copy templates, and partner-role translations.

This is a core differentiator from generic fertility calendars, chatbots, and wellness dashboards: Fevio behaves like a State-Based Care OS that turns sensitive IVF context into safe patient actions and privacy-preserving partner roles.

Implementation rules:

- Intent-based projection chooses from existing widgets: medication, schedule, clinic briefing, record, partner action.
- Contextual editorial copy is Korean-first and template-constrained.
- Adaptive visuals follow care phase: injection = time/action clarity, clinic = briefing/trust, waiting = low-noise support.
- Micro-interviews reveal only the next necessary input.
- All extracted medical content remains draft until the user confirms it.

## 4. Component strategy

### Action-first components

Use for injection and trigger moments.

- Countdown and checklist come before explanation.
- Critical medication cards use clear completion controls.
- The partner receives an action role, not a medical panic alert.

### Contextual translation components

Use for clinic visit and result interpretation.

- Translate AMH, E2, follicle size, and embryo grade into patient-friendly context.
- Do not overpromise outcomes.
- Pair clinical terms with plain-language meaning and emotional buffering.

### Quiet & empathy components

Use for waiting and emotional-load moments.

- Emotion input is private by default.
- Shared emotion becomes a partner nudge, not a score or raw diary.
- Community/cohort concepts must avoid toxic triggers.

## 5. Copy decision cards

| Context | Do | Do not |
| --- | --- | --- |
| Save error | 잠시 저장이 불안정해요. 입력은 그대로 두고 다시 확인해 볼게요. | 저장 실패. 다시 시도하세요. |
| Medication reminder | 지금은 주사 준비를 시작할 시간이에요. 약 이름과 시간을 함께 확인해요. | 주사를 놓치면 안 됩니다. |
| Partner reminder | 지금은 준비를 도와주면 좋아요. 알코올 솜과 약을 함께 확인해 주세요. | 배우자가 주사를 맞아야 합니다. |
| Emotion shared | 오늘은 조금 지쳐 보여요. 먼저 집안일 하나를 맡아 주세요. | 우울함 80%를 기록했습니다. |
| Waiting day | 몸의 작은 변화가 크게 느껴질 수 있어요. 오늘은 확인보다 쉬는 쪽을 먼저 둘게요. | 좋은 결과가 있을 거예요! |
| Clinic day | 병원에서 들은 내용을 카드 초안으로 정리했어요. 확정 전 함께 확인해요. | 병원 지시를 자동 등록했습니다. |
| Draft uncertainty | 이 항목은 의미가 조금 애매해요. 오늘 할 일로 넣기 전에 확인해 주세요. | 분류 실패. |
| Trigger shot | 시간 확인이 중요한 주사예요. 알람을 끄기 전 약 이름과 시간을 한 번 더 볼게요. | 치명적인 일정입니다. |
| Embryo grade | 등급은 하나의 관찰 정보예요. 필요한 맥락만 차분히 남겨둘게요. | C등급이라 낮습니다. |
| Partner sync | 내 화면의 확정 카드가 파트너 역할로 바뀌어 전달돼요. | 모든 기록이 파트너에게 공유됩니다. |
| Privacy | 공유 전에는 원문 메모와 민감 기록을 보여주지 않아요. | 개인정보가 노출될 수 있습니다. |
| Completion | 확인했어요. 오늘 홈에 필요한 만큼만 반영할게요. | 완료! 축하합니다! |

## 6. Visual principles

- Bright glassmorphism, not green-heavy medical UI.
- Cream/sage/lavender/coral are semantic, not decorative.
- Solid white cards carry critical information; glass surfaces frame or group, not reduce readability.
- Desktop demo should feel like realistic iPhone 17 Pro Max devices placed on a table.
- Real mobile must be bezel-less and app-like.
- Dynamic Island and safe area are fixed device tokens, not floating decorative elements.

## 7. Closure standard

A UI/UX issue can reference this document only if it also provides:

- token-backed implementation;
- screenshot or Vercel metric;
- copy that follows restrained warmth;
- partner translation where partner UI is involved;
- deletion or refactor of ad-hoc UI that violates these rules.
