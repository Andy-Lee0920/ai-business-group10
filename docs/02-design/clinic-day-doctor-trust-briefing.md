# ClinicDay Doctor-Trust Briefing Surface

Status: Execution brief for #140.

## Goal

ClinicDay should feel like a concise briefing the patient can bring into the consultation room, not like an InjectionDay variant with green copy.

## First viewport composition

1. Eyebrow: `진료 준비`
2. Title: `오늘 진료실에 가지고 갈 것들`
3. Fact line: `질문 2개 · 지난 7일 케어 기록 · 파트너 동행`
4. Primary action: `진료 브리핑 열기`
5. Hero content: numbered briefing list, not a generic MomentHero stack.

## Briefing contents

- Questions to ask the doctor.
- Last seven days care execution summary.
- Medication/injection record summary.
- User-selected symptoms or notes.
- Next appointment / instruction capture entry point.
- Photo or memo capture affordance for clinic notes.

## Partner role

Partner reads as `동행자` or `기록 도우미`, with two or three concrete actions only: 이동 시간 확인, 설명 메모, 다음 일정 함께 확인.

## Boundaries

No medical recommendation generation, doctor portal, EHR export, or treatment strategy inference.

## URL verification

- `/home?care=clinic`: reviewer understands “bring this into the clinic visit” within three seconds.
- `/demo` clinic step: partner role reads as companion/logistics support, not raw projection.
