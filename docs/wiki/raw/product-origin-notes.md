# Raw Notes: 제품 기원 (original-note-hyunjoo.md + prd-v1.0.md)

> 이 파일은 원본 자료에서 뽑은 핵심 메모다. 요약이 아니라 판단 기준으로 쓸 수 있는 원문 발췌.

## 사용자 인터뷰 핵심 (3인)

### 인터뷰이 A — 약 혼동 경험
- 처방받은 약 이름이 비슷하거나 생김새가 유사해 착각
- 주사를 빠뜨린 경험 → "시술에 영향을 주는 주사"
- 도출: 약 종류별 시각적 구분, 중요도 기반 경고 알림

### 인터뷰이 B — 부부 정보 비대칭
- 파트너가 주사를 직접 놔줘야 하는데, 귀가 후 전달 과정에서 정보 누락·왜곡
- "뭘 어떻게 해야 하는지 모르겠다" — 파트너 측 혼란
- 도출: 실시간 정보 공유 + 파트너용 간결한 액션 가이드

### 인터뷰이 C — 감정 소진
- 정보 관리, 병원 일정, 주사 준비까지 모두 혼자 감당
- "나만 고생하는 것 같아서 억울하다"
- 도출: 부부 역할 가시화 + 감정 기록 및 공유

## PRD v1.0 핵심 판단 기준 (Q1–Q20 결정)

| # | 결정 사항 |
|---|---|
| Q1 | Action Split 기본 메커니즘 = Manual line split (LLM P1) |
| Q4 | Partner auth = 링크 기반 무계정 유지 |
| Q5 | LLM key = Supabase Vault + Edge Function + manual fallback |
| Q8 | SplitCandidate 저장 = Capture CTA → raw 저장만, Confirm → batch 저장 |
| Q9 | LLM output contract = suggested_* only, assigned_to remains null |
| Q10 | safety_level = deterministic display priority + optional user marking |
| Q14 | Partner View data = Live view (no snapshot) |
| Q16 | First login Home = care_day = onboarding |
| Q19 | MVP cut = all 5 screens P0, thin vertical slice |

## Core Product Insight (PRD §2.2)

> "핵심 문제는 정보 부족이 아니다. 병원 지시사항은 존재한다."
> "진짜 문제는 **정보 번역 격차 + 운영 과부하**다."

- 오늘 몇 시에 무엇을 해야 하는가
- 어떤 항목은 병원에 다시 확인해야 하는가
- 파트너가 무엇을 도와야 하는가
- 어떤 행동은 완료되었는가
- 어떤 행동은 놓치면 안 되는가

→ 이 다섯 가지 번역 책임이 한 사람에게 집중된다.

## Product Positioning

나쁜: "AI가 IVF 치료를 관리해주는 앱"
권장: "병원 지시사항을 부부가 실수 없이 함께 실행하도록 돕는 치료 운영 시스템"
날카로운: "IVF 치료 과정에서 한 사람에게 몰린 기억·전달·확인 부담을 오늘의 부부 실행 카드로 나누는 앱"

## North Star에서 검증된 고객 경험 10가지

1. 오늘 해야 할 일을 바로 보는 것
2. 직접 입력하는 귀찮음을 줄이는 것
3. **자동 정리는 원하지만 최종 확인권은 본인이 갖는 것** ← 핵심
4. 중요한 정보를 놓치지 않는 것
5. 파트너가 무엇을 도와야 하는지만 알게 하는 것
6. 민감한 정보는 스스로 통제하는 것
7. 처음 시험관을 시작할 때 복잡한 과정을 쉽게 이해하는 것
8. 앱이 재촉하거나 감정적으로 부담 주지 않는 것
9. 시술 기간 동안만 집중적으로 쓰는 실용적인 도구
10. 유료 가치가 단순 캘린더를 넘어서는 것
