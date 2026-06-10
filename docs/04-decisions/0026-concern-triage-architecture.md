# ADR 0026 — Concern triage architecture: stored signal tags, read-inline/write-route, LLM-as-classifier

## Status

Accepted — 2026-05-30

## Context

`+` 버튼 진입점에 "불안을 실행 가능한 확인·정리·알림으로 바꿔주는" 기능을 추가한다 (closed-beta 사용자 피드백). 이 기능은 감정 상담 챗봇이 아니라 운영 분류 도구여야 하며, 사용자는 "AI가 알아서 판단한다"는 인상을 거부했다.

세 가지 설계 압력이 충돌했다:

1. 사용자는 "이전에 걱정했던 것"을 앱이 기억해주길 원하지만 (context 재사용), ADR 0025 는 감정 발화 본문 저장을 금지한다.
2. "정리해드릴게요"의 가치를 위해 결과를 보여줘야 하지만, ADR 0009 는 AI 가 임의 의료 화면을 그리는 것을 금지한다.
3. Manual P0 must work without LLM (제품 불변) — LLM 이 의료 fact 를 생성하면 안 된다.

## Decision

Concern triage 를 다음 세 경계로 설계한다.

### 1. 저장: Concern signal (분류 태그만)

사용자 발화는 **분류된 시그널 태그**로만 persist 한다: `{ intent, related_card_id?, created_at }`. 발화 원문·LLM 응답 본문은 어느 테이블에도 저장하지 않는다. couple-scoped RLS, primary-private 기본. 다음 세션의 "이전에도 주사 시간을 확인하셨으니..." 맥락은 태그 존재 여부에서 deterministic template 으로 발화되며 LLM 자유 생성이 아니다.

### 2. 제시: 읽기는 인라인, 쓰기는 라우팅

- **읽기** (오늘 카드 확인, 원문 보기): 대화 안에서 `computeCareSurface` 결과의 read-only projection 으로 요약. Concern triage 는 새 카드 컴포넌트를 발명하지 않고 ADR 0009 의 `CareSurfaceComponent` 를 canonical 로 재사용한다.
- **쓰기** (일정 초안, 알림 변경, 파트너 공유, clinic question 저장): 어떤 쓰기도 자동 실행하지 않는다. 기존 surface 로 라우팅하고 사용자가 마지막 확인을 한다 (ADR 0013 confirm spine).

이 경계가 "제가 정리만, 확정은 사용자가" 제품 문구의 코드 수준 보장이다.

### 3. LLM 계약: card_id 만 고르는 분류기

LLM 입력 = 발화 + `confirmedPhase` + `phaseCareDay` + 오늘 카드 **메타데이터만** (`card_id`, `type`, `scheduled_at`, `reminder_status`) + 과거 concern signal 태그 + 파트너 연결 상태. LLM 출력 = `{ intent, summary_template_id, action_ids[] }` 고정 스키마. LLM 은 카드를 **ID 로만** 참조하고 약 이름·용량·시간·원문을 출력하지 않는다. 의료 specifics 는 deterministic 렌더러가 confirmed card 에서 채운다.

원문 메모·visit note·약 이름 문자열·couple journal·통증 점수·emotion note·파트너 신원은 LLM 입력에서 제외한다.

위기 신호 (자해/우울증 키워드) 감지 시 LLM 호출을 우회하고 운영팀 큐레이션 "전문가 상담 안내" 정적 카드로 fail-closed 한다 (ADR 0025 rule 5 승계). 이 경우 concern signal 도 저장하지 않는다.

### 4. 캡처 진입 통합은 단계화 (이번 라운드 라우팅, 다음 라운드 인입)

`+` 는 장기적으로 단일 진입점이 되어 사진/붙여넣기 안내문 인입까지 흡수하는 것이 목표다. 그러나 캡처 spine 은 최근 안정화된 P0 이므로 (`next-tasks.md`), 케어 에이전트 신설과 캡처 진입 재배선을 동시에 하지 않는다 (ADR 0027 defer 논리 동형).

- **이번 라운드**: "주사·복약 남기기" / "병원 방문 남기기" 는 케어 에이전트 안의 **라우팅 칩**으로 유지하며 기존 `/capture` 로 보낸다. 사진/붙여넣기 입력은 `/capture` 에서 일어난다.
- **다음 라운드**: 사진/붙여넣기 affordance 를 에이전트 진입부로 끌어올린다. 단 파싱은 기존 `clinic-memo-parser.ts` 를 그대로 재사용하고 (CLAUDE.md 안티패턴 #1: 하나의 도메인 함수, 다른 주입점), 확정·저장은 split-review/confirm surface 로 라우팅한다 (쓰기 경계 유지). 채팅 안에서 파싱·확정을 끝내는 "대화형 문진" 은 금지.

## Considered Options

- **세션 메모리만 (무저장)** — context 재사용이 같은 세션 내로 제한되어 "이전에도 걱정하셨으니" 가치를 잃는다.
- **대화 이력 전체 저장** — 감정 발화 본문이 DB 에 남아 "파트너에게 보이나" 불안을 직접 야기하고 ADR 0025 정신을 뒤집는다.
- **Agent 가 대화 안에서 카드를 합성 (pure compose)** — 위젯 레지스트리 이중화 + ADR 0009 가 금지한 fully-generative 방향.
- **Agent 가 기존 화면으로만 라우팅 (pure route)** — 화면 전환이 잦아 불안한 사용자에게 "또 끌려간다" 느낌.

## Consequences

### Easier

- 의료 환각이 아키텍처 수준에서 불가능 — LLM 이 약명·용량을 말할 경로가 없다.
- ADR 0025 schema 변경 불필요 — concern signal 은 별도 경량 엔티티.
- "AI 가 알아서 판단" 불안 회피 — 모든 쓰기가 사용자 확인을 거친다.
- `/emotion` 의 기분 로깅·파트너 신호 직무를 더 정확한 형태(걱정→역할)로 대체 (ADR 0025 와 함께 감정 표면을 셋 → 둘로 정리).

### Harder

- concern signal intent 분류 체계를 운영팀이 큐레이션·유지해야 한다.
- summary_template / action_ids 레지스트리가 deterministic 코드에 고정되어, 새 액션마다 코드 변경이 필요하다 (자유 생성 불가의 의도된 비용).
- 위기 신호 fallback 책임이 또 하나의 표면(concern triage)으로 확장된다.

### Prohibited

- 발화 원문 / LLM 응답 본문을 어떤 테이블에라도 저장.
- LLM 이 약 이름·용량·시간·원문·진단·조언을 출력.
- Concern triage 가 사용자 확인 없이 care_action_cards / reminder / 파트너 공유를 자동 변경.
- Concern triage 가 새로운 파트너 노출 경로를 생성 (기존 role-only projection 만 경유).
- 사용자 카피에 "챗봇" / "감정 상담" / "걱정 정리"·"concern triage" 류 문제-명명 framing 사용. 사용자 노출 라벨은 "케어 에이전트" 로 고정하되, "에이전트" 의 자율 인상을 상쇄하기 위해 "정리만, 확정은 사용자" 비자율 계약을 UI 카피에 분명히 드러내야 한다 (CONTEXT.md Care Agent 참조). 진입 프롬프트는 걱정을 점화하는 "무엇이 걱정되세요?" 금지, 케어 프레임 사용.

## Related

- ADR 0009 — state-driven generative UI (Concern triage 가 `CareSurfaceComponent` 를 canonical 로 재사용)
- ADR 0013 — confirm spine (모든 쓰기 라우팅의 마지막 확인)
- ADR 0021 — Daily Brief LLM exploration (deterministic guardrail dict 패턴 차용)
- ADR 0025 — Brief Reflection Turn (위기 fallback 승계, 무저장 표현 표면은 유지)
- ADR 0027 — Surface Lifecycle defer/extend
- `CONTEXT.md` — Concern triage / Concern signal / Clinic question / Reminder strength
