# Raw Notes: 핵심 ADR 결정 요약

> 각 ADR의 핵심 판단 규칙과 금지 사항. 재논의 시 참고용.

## ADR 0001 — SLC-first, manual-first
- 첫 제품은 Vercel Preview + Supabase 백엔드 webapp
- P0 경로는 LLM 가용성, user API key, 모델 출력에 의존할 수 없다
- App Store/native는 첫 SLC 범위 밖

## ADR 0007 — Privacy delete and partner disconnect boundary
- 파트너 공유: active read-only link 취소로 즉시 중단 가능
- 전체 계정/데이터 삭제: v1은 request-based (자동 삭제 job 없음)
- Privacy Gate 필수 포함 내용: 저장 경계, 파트너 연결 해제, 삭제 요청, 의료 경계

## ADR 0009 — State-driven Generative UI
- 핵심 판단: 완전 생성 UI는 의료 안전성·접근성·QA 재현성을 약화시킨다
- TPO specificity-first 슬롯 선택 (누적 점수 방식 거부 이유: 약한 신호 두 개가 의도치 않게 고긴급 surface 생성 가능)
- 6개 고정 슬롯: hero / primary_card / secondary_card / stats_row / checklist / partner
- 금지: AI가 임의 레이아웃·의료 정보·파트너 visible 범위 생성
- 금지: emotionTrend active questioning ("오늘 컨디션 어때요?" 스타일 push는 지친 환자에게 부담)

## ADR 0011 — CycleEvent 상태 머신
- 캐노니컬 phase = CycleEvent stream의 pure reducer 결과
- 3레이어: predictedPhase / suggestedPhase / **confirmedPhase**
- 규칙: home / partner / notification surfaces는 오직 confirmedPhase만 읽는다
- 금지: 자동 타이머 기반 phase 전환, card_type 역추론을 canonical phase로 사용

## ADR 0013 — Confirm spine canonical
- 문제: 두 개의 병렬 confirmed lane (schedule_items vs care_action_cards) 존재
- 결정: care_action_cards가 유일한 canonical confirmed table
- schedule_candidates, schedule_items는 legacy — 새 기능에 write path 추가 금지
- photo/OCR → split_candidates → care_action_cards 단일 파이프라인으로 통합

## ADR 0021 — Daily Brief: closed-beta LLM, deterministic destination
- 배경: retention hook 부재 (사용자가 돌아올 이유 없음)
- 결정: admin-keyed LLM 생성 + deterministic guardrail dict 주입
- **핵심 의도**: LLM은 exploration tool, production destination은 deterministic template pool
- Fallback: LLM 실패 시 factDict raw text가 Brief 자리에 표시 (Brief surface 자체는 사라지지 않음)
- 금지: BYOK를 Brief에 적용, LLM이 factDict 밖 의료 fact 출력, production에서 LLM 의존 영구화

## ADR 0023 — Partner Brief: separate contract
- 결정: Primary Brief의 sanitized projection이 아니라 완전히 별개의 LLM call
- 형식: momentLine (정서 한 줄) + helpAction (구체 행동 1개)
- 금지 입력: 약 이름, 용량, primary 감정 발화, journal entry, raw clinic memo
- 금지 출력: 의료 fact, 진단, partner 의무/책임/평가 표현
- 이유: "sanitize 실수 표면 자체를 없앤다" — 분리된 LLM call이 primary 민감 자료의 누출 경로를 차단

## ADR 0029 — Confirm UI mandatory inline quote rule
- 결정: mustInlineQuote = (suggestedCardType in ['injection', 'medication']) AND (assignedTo === 'my_action')
- 이유: primary user가 직접 실행할 약/주사 후보는 원문이 반드시 보여야 한다
- 금지: 컴포넌트 로컬에서 규칙 재정의, demo flags로 우회
