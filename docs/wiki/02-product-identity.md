# Fevio 제품 정체성과 경계

> "Fevio는 state-driven IVF care operations app for confirmed clinic instructions, medication execution, and partner role sharing."
> — fevio-product-north-star.md

## 한 줄 정의

**병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.**

Fevio는 IVF 치료자가 병원 안내와 투약 일정을 놓치지 않도록, 파트너와 함께 확인하고 기록하는 치료 운영 앱이다.

## Fevio인 것 vs 아닌 것

### Fevio is
- 병원 안내와 투약 일정을 놓치지 않게 하는 IVF 치료 운영 앱
- 환자와 파트너가 하나의 care state를 함께 확인하는 앱
- 역할과 공유 권한에 따라 실행 UI가 달라지는 앱
- 설명보다 투약·방문·기록 실행을 돕는 utility-first 앱
- 환자의 통제권과 프라이버시를 우선하는 앱

### Fevio is NOT
- 단순 생리/배란 추적 앱
- 병원 예약 캘린더
- 약 알림 앱 (건강앱으로 대체 가능)
- 감정 일기 앱
- 환자 화면을 파트너에게 복사해서 보여주는 공유 앱
- 의료 판단이나 치료 추천을 하는 AI 앱
- 예쁜 화면만 보여주는 static mock demo

## 핵심 아키텍처 원칙

```text
Care State
+ Role
+ Sharing Level
+ Utility State
+ Action Log
= Role-aware Generative UI
```

중요한 것은 이 Generative UI가 **LLM이 자유롭게 화면을 즉흥 생성하는 구조가 아니다**. Fevio의 UI는 관리된 컴포넌트 시스템 안에서 동적으로 생성된다. **free-form generation이 아니라 governed, state-driven generation**이다.

## 제품이 느껴야 하는 감성 (CLAUDE.md)

| 속성 | 설명 |
|---|---|
| Calm by default | 불안을 자극하지 않고 다음 행동만 명확하게 |
| Deterministic first | AI 없이도 작동하는 확정적 로직 우선 |
| Privacy-first | 민감 케어 데이터는 동의 게이트 뒤에서만 기록 |
| Partner-aware | 같은 앱, 같은 상태, 역할에 맞는 다른 화면 |
| Mobile-first | 모바일 뷰포트 우선 |
| Korean-first | 한국어 우선 가독성 |

## 온보딩 원칙

Fevio 온보딩은 프로필 데이터를 수집하는 것이 목적이 아니다. **목적은 사용자의 첫 care state를 만들고, 그 상태가 환자와 파트너에게 다른 utility 인터페이스를 생성하도록 구성하는 것**이다.

모든 온보딩 질문은 다음 중 하나를 변경해야 한다:
- `inferredStage` / `firstCareItem` / `utilityCards` / `roleContext` / `sharingLevel` / `partnerProjection` / `explanationDensity`

care UI에 영향을 주지 않는 질문은 온보딩에서 빠져야 한다.

## 폰 안 화면 원칙: Utility-Only

### 금지 (장문 설명)
```
오늘은 배아 발달 결과를 기다리는 단계입니다.
이 단계에서는 불안할 수 있지만 차분히 기다려야 합니다.
```

### 허용 (기능 컴포넌트)
```
Day 5 결과 · 내일 오전
배아 수 / 동결 여부 / 다음 연락일 / 공유 범위 / 약 시간 / 완료 확인
```

## 완료의 기준

> "Vercel URL을 열었을 때 product surface가 실제로 보이고, 조작되고, 상태가 바뀌어야 done이다."

모든 issue의 acceptance criteria는 반드시:
```text
[URL]에서 [사용자 역할]이 [행동]했을 때 [기대 결과]를 본다.
```

테스트 통과 + typecheck 통과는 필요조건이지 충분조건이 아니다.

## Non-Negotiable 원칙

```
No static fake screen.
No long explanatory phone copy.
No partner copy-paste view.
No medical judgment.
No forced sharing.
No careless wording around sensitive reproductive actions.
No "done" without Vercel-visible product surface.
```

---

**관련 페이지:** [01-true-problem.md](01-true-problem.md) | [03-medical-boundary.md](03-medical-boundary.md) | [05-partner-projection.md](05-partner-projection.md) | [06-care-loop-architecture.md](06-care-loop-architecture.md)
