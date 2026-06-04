# Wiki 작업 기록

## 2026-06-04 — 초기 wiki 구축

### 읽은 원본 자료

| 파일 | 목적 |
|---|---|
| `docs/01-product/original-note-hyunjoo.md` | 제품 기원 — 사용자 인터뷰 3건 발췌, PRD v0.1 |
| `docs/01-product/prd-v1.0.md` | 최종 PRD — Q1~Q20 결정, 전체 스키마, 5개 P0 화면 |
| `docs/01-product/fevio-product-north-star.md` | 제품 철학 — 10가지 customer job, Non-Negotiable |
| `docs/01-product/slc-target.md` | SLC 정의 및 release gate |
| `CONTEXT.md` | 도메인 언어 정의 (Care Day, Split Candidate, Partner Action View 등) |
| `CLAUDE.md` | 에이전트 작업 원칙, 반복 원칙, 안티패턴 목록 |
| `README.md` | 배포 상태, 구현된 흐름, 다음 이슈 목록 |
| `docs/04-decisions/0001-slc-first-manual-first.md` | SLC 전략 결정 |
| `docs/04-decisions/0007-privacy-delete-boundary.md` | 개인정보 삭제 경계 |
| `docs/04-decisions/0009-state-driven-generative-ui.md` | State-driven UI 아키텍처 결정 |
| `docs/04-decisions/0011-cycle-event-state-machine.md` | CycleEvent reducer + confirmedPhase 규칙 |
| `docs/04-decisions/0013-confirm-spine-canonical.md` | care_action_cards canonical 결정, schedule_items legacy |
| `docs/04-decisions/0021-daily-brief-llm-exploration-deterministic-destination.md` | Daily Brief LLM 의도 및 destination |
| `docs/04-decisions/0023-partner-brief-separate-contract.md` | Partner Brief 분리 계약 |
| `docs/04-decisions/0029-confirm-ui-mandatory-inline-quote-rule.md` | 약/주사 원문 표시 규칙 |
| `docs/03-engineering/schema-rls-matrix.md` | 스키마·RLS 불변 규칙 전체 |
| `progress.txt` | 2026-05-28 테스트 커버리지 baseline |

### 생성한 파일

#### raw/ (원본 자료 핵심 메모)
- `raw/product-origin-notes.md` — 인터뷰 발췌, PRD Q1-Q20, positioning 원문
- `raw/adr-key-decisions.md` — ADR 0001~0029 핵심 판단 규칙 요약
- `raw/schema-invariants.md` — 스키마·RLS 절대 불변 규칙

#### wiki 페이지 (주제별)
- `01-true-problem.md` — 진짜 문제: 정보 번역 격차 + 운영 과부하
- `02-product-identity.md` — 제품 정체성, 경계, 온보딩 원칙
- `03-medical-boundary.md` — 의료 판단 금지 원칙 및 구체 규칙
- `04-confirmation-first.md` — OCR/AI 결과를 바로 확정하지 않는 이유
- `05-partner-projection.md` — 파트너 화면이 projection이어야 하는 이유
- `06-care-loop-architecture.md` — 5개 P0 화면, couple bootstrap, inferCardType
- `07-data-model.md` — 테이블 계보, canonical table, CycleEvent reducer
- `08-ai-llm-policy.md` — LLM 사용 영역별 분류, 금지 동작
- `09-dynamic-home-careday.md` — CareDay 상태 머신, TPO 슬롯, CSS intensity
- `10-implementation-status.md` — 완료/진행/미완 흐름, 테스트 커버리지, 다음 이슈

#### 인덱스
- `index.md` — 전체 목차, 핵심 질문 탐색, 페이지 간 연결 지도

### 발견한 숨겨진 전제들

위키 작성 과정에서 문서에 명시적으로 쓰여있지 않지만 실질적으로 작동하는 전제들:

1. **두 개의 병렬 lane 문제**: `schedule_items`와 `care_action_cards`가 코드베이스에 공존한다. ADR 0013이 canonical을 결정했지만 `/home`의 reader 마이그레이션이 아직 진행 중이다.

2. **LLM은 exploration tool**: Daily Brief의 LLM 사용은 영구화 의도가 아니다. closed-beta에서 좋은 패턴을 발견해 deterministic template pool로 이관하는 것이 명시적 목표다.

3. **Partner Brief는 sanitize가 아님**: Primary Brief를 파트너용으로 필터링하는 게 아니라, partner LLM input에 민감 정보 자체가 없어야 한다. 이것이 분리된 LLM call의 핵심 이유다.

4. **Waiting Day는 자동 전환 안 됨**: 사용자가 명시적으로 선택해야 한다. 앱이 "당신 지금 waiting day 같아요"라고 자동 전환하면 환자에게 추가 부담.

5. **routine_day가 첫 로그인 상태가 아님**: 처음 로그인하면 `onboarding`이다. `hasEverCaptured = false`인 경우에만. 이것을 모르면 첫 홈이 이상하게 보인다.

6. **분류 버튼 클릭은 DB 쓰기 없음**: 이것이 의도적 설계다. Confirm CTA 전까지 모든 분류 상태는 client-side only다. 중간 상태가 저장되면 안 된다.
