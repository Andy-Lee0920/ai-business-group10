# Fevio [페비오] LLM Wiki

> IVF 환자와 파트너를 위한 케어 운영 앱의 제품 판단 기준, 반복 원칙, 의사결정 규칙, 숨겨진 전제를 정리한 지식 베이스.
> 단순 요약이 아니라 **왜 이렇게 만들었는가**를 설명한다.

## 핵심 질문 탐색

| 질문 | 페이지 |
|---|---|
| Fevio가 해결하려는 진짜 문제는 무엇인가? | [01-true-problem.md](01-true-problem.md) |
| Fevio는 어떤 제품이고 어떤 제품이 아닌가? | [02-product-identity.md](02-product-identity.md) |
| Fevio가 의료 판단을 하지 않는 이유는 무엇인가? | [03-medical-boundary.md](03-medical-boundary.md) |
| AI/OCR 결과를 바로 일정으로 확정하지 않는 이유는? | [04-confirmation-first.md](04-confirmation-first.md) |
| 파트너 화면이 환자 화면 복사가 아니라 projection이어야 하는 이유는? | [05-partner-projection.md](05-partner-projection.md) |
| 현재 구현 흐름과 다음 우선순위는 무엇인가? | [10-implementation-status.md](10-implementation-status.md) |

---

## 전체 페이지 목차

### 제품 이해

| 페이지 | 핵심 내용 |
|---|---|
| [01-true-problem.md](01-true-problem.md) | 정보 번역 격차 + 운영 과부하. "나만 고생한다"는 감정의 구조적 원인 |
| [02-product-identity.md](02-product-identity.md) | Fevio인 것 vs 아닌 것. 온보딩 원칙. Non-Negotiable 목록 |
| [03-medical-boundary.md](03-medical-boundary.md) | 왜 의료 판단 금지인가. LLM에도 동일 적용. display_safety_level은 UI 우선순위 |

### 핵심 설계 원칙

| 페이지 | 핵심 내용 |
|---|---|
| [04-confirmation-first.md](04-confirmation-first.md) | 두 단계 commit. 분류 버튼 클릭 = DB 쓰기 없음. mustInlineQuote 규칙 |
| [05-partner-projection.md](05-partner-projection.md) | projection 수식. Partner Brief 분리 이유. PartnerSurfaceSignal 타입 |
| [08-ai-llm-policy.md](08-ai-llm-policy.md) | BYOK P1. Daily Brief는 exploration tool. Partner Brief 분리 LLM call |

### 아키텍처

| 페이지 | 핵심 내용 |
|---|---|
| [06-care-loop-architecture.md](06-care-loop-architecture.md) | 5개 P0 화면. couple bootstrap. computeCareDay. Forbidden Components |
| [07-data-model.md](07-data-model.md) | care_action_cards canonical. 두 commit point. CycleEvent reducer |
| [09-dynamic-home-careday.md](09-dynamic-home-careday.md) | 5가지 CareDay. TPO specificity-first 슬롯. CSS intensity 계약 |

### 현황

| 페이지 | 핵심 내용 |
|---|---|
| [10-implementation-status.md](10-implementation-status.md) | 완료/진행/미완 흐름. 테스트 커버리지. 다음 우선순위 이슈 |

### 원본 자료 (raw/)

| 파일 | 내용 |
|---|---|
| [raw/product-origin-notes.md](raw/product-origin-notes.md) | 인터뷰 발췌, PRD Q1-Q20, positioning 원문 |
| [raw/adr-key-decisions.md](raw/adr-key-decisions.md) | ADR 0001~0029 핵심 판단 규칙 요약 |
| [raw/schema-invariants.md](raw/schema-invariants.md) | 스키마·RLS 절대 불변 규칙 |

---

## 페이지 간 연결 지도

```
01 진짜 문제
  ├─→ 02 제품 정체성 (무엇을 만드는가)
  └─→ 03 의료 경계 (무엇을 안 하는가)
        └─→ 04 Confirmation-First (AI/OCR 처리 방식)
              └─→ 07 데이터 모델 (확정 타이밍 규칙)

05 Partner Projection
  ├─→ 03 의료 경계 (partner에게도 동일 적용)
  └─→ 08 AI/LLM 정책 (Partner Brief 분리)

06 케어 루프
  ├─→ 09 Dynamic Home (computeCareDay)
  └─→ 07 데이터 모델 (테이블 계보)

10 구현 현황
  ├─→ 06 케어 루프 (구현된 흐름)
  └─→ 09 Dynamic Home (진행 중 Epic)
```

---

## 작업 기록

[log.md](log.md) 참고.

---

*마지막 갱신: 2026-06-04*
*원본 자료: README.md, CONTEXT.md, CLAUDE.md, prd-v1.0.md, fevio-product-north-star.md, slc-target.md, ADR 0001~0029, schema-rls-matrix.md, progress.txt*
