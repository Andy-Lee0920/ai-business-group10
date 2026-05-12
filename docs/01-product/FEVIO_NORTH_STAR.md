# Fevio Product North Star

> **Same app. Shared state. Different experience.**

Fevio는 난임 치료를 한 사람이 혼자 기억하고 전달해야 하는 복잡한 의료 과정에서, 부부가 함께 이해하고 실행할 수 있는 **state-driven care experience**로 전환하는 앱이다.

Fevio의 목표는 단순한 일정표, 약 알림, 기록장이 아니다.
Fevio는 IVF care cycle의 현재 상태를 읽고, 환자와 파트너에게 각자 필요한 utility UI를 다르게 제공하는 **Generative UI 기반 Care OS**다.

---

## 1. One Sentence

**Fevio는 하나의 IVF care cycle state를 환자와 파트너의 역할에 맞는 utility interface로 변환하는 Generative UI Care OS다.**

---

## 2. Why Fevio Exists

난임 치료는 부부의 일이지만, 실제 운영 부담은 한 사람에게 집중되기 쉽다.

환자는 병원에서 들은 일정, 약 이름, 주사 시간, 검사 결과, 다음 방문일을 기억하고 집에 돌아와 다시 설명해야 한다. 파트너는 돕고 싶어도 무엇을 해야 할지 알기 어렵다. 이 정보 전달 구조는 실수, 불안, 반복 질문, 감정적 갈등으로 이어진다.

Fevio는 이 문제를 "더 많은 설명"으로 해결하지 않는다.
Fevio는 치료 상태를 구조화하고, 그 상태를 각 역할에 맞는 행동 UI로 번역한다.

환자에게는 기록, 확인, 입력, 공유 제어가 필요하다.
파트너에게는 준비, 동행, 관찰, 다음 행동 확인이 필요하다.

같은 치료 상태라도 두 사람이 봐야 하는 화면은 달라야 한다.

---

## 3. Product Thesis

### Fevio is not

- 단순 생리/배란 추적 앱
- 병원 예약 캘린더
- 약 알림 앱
- 감정 일기 앱
- 환자 화면을 파트너에게 복사해서 보여주는 공유 앱
- 의료 판단이나 치료 추천을 하는 AI 앱

### Fevio is

- IVF care cycle을 따라가는 상태 기반 케어 앱
- 환자와 파트너가 하나의 care state를 공유하는 앱
- 역할과 공유 권한에 따라 UI가 달라지는 앱
- 설명보다 실행을 돕는 utility-first 앱
- 환자의 통제권과 프라이버시를 우선하는 앱
- 나중에 실제 제품 코드로 확장 가능한 state-driven interactive prototype

---

## 4. Core Architecture Principle

```text
Care State
+ Role
+ Sharing Level
+ Utility State
+ Action Log
= Role-aware Generative UI
```

Fevio의 Generative UI는 LLM이 자유롭게 화면을 즉흥 생성하는 구조가 아니다.

Fevio의 UI는 관리된 컴포넌트 시스템 안에서 동적으로 생성된다.
입력은 care state, role, sharing permission, utility state이고, 출력은 환자와 파트너 각각에게 필요한 utility card 조합이다.

즉, Fevio의 Generative UI는 **free-form generation**이 아니라 **governed, state-driven generation**이다.

---

## 5. The 7-Stage IVF Care Cycle

Fevio의 top-level structure는 기존 3-scene이 아니라 IVF 7-stage care cycle이다.

```text
1. 사전 검사
2. 배란 유도
3. 난자 채취
4. 수정 준비
5. 배아 배양
6. 배아 이식
7. 임신 확인
```

기존의 "주사 / 병원 / 대기"는 top-level navigation이 아니다.
이 세 장면은 각 stage 안에 내장되는 `DominantMode`로 흡수된다.

예시:

```text
Stage 2 배란 유도 → 주사 실행
Stage 3 난자 채취 → 시술 회복
Stage 5 배아 배양 → 결과 대기
Stage 7 임신 확인 → 결과 확인
```

이 구조의 목적은 IVF를 모르는 사람도 치료가 하나의 긴 care cycle이라는 점을 이해하게 만드는 것이다.

---

## 6. Utility-Only Phone Content

폰 안 화면은 발표 대본이 아니다.
폰 안 화면은 기능 블록이어야 한다.

### 금지

```text
오늘은 배아 발달 결과를 기다리는 단계입니다.
이 단계에서는 불안할 수 있지만 차분히 기다려야 합니다.
파트너는 곁에서 정서적으로 지지하는 것이 중요합니다.
```

### 허용

```text
Day 5 결과 · 내일 오전
배아 수
동결 여부
다음 연락일
공유 범위
hCG 검사일
약 시간
완료 확인
```

Stage 설명은 phone 내부가 아니라 selector 아래 1줄 context로만 제공한다.

```text
5/7 배아 배양 · 배아 발달을 기다리고 결과를 기록합니다
오늘 모드: 결과 대기
```

Phone 내부는 utility card로만 구성한다.

예시:

```text
EmbryoUpdateTimeline
EmbryoResultCard
NextUpdateReminder
ResultVisibilityControl
BetaHcgInputCard
MedicationTracker
```

---

## 7. Partner Screen = Projection, Not Copy

파트너 화면은 환자 화면의 복사본이 아니다.

파트너 화면은 다음 요소의 projection이다.

```text
Shared Care State
+ Sharing Level
+ Permission
+ Patient Action
+ Partner Role
```

예시:

Stage 7에서 환자가 "다음 일정만 공유"를 선택하면, 파트너는 hCG 수치를 볼 수 없다.
파트너는 다음 검사일, 약 지속 여부, 병원 안내만 본다.

이것이 Fevio의 privacy-first 원칙이 UI 레벨에서 구현되는 방식이다.

```ts
function getVisiblePartnerCards({ scenario, state }) {
  return scenario.partner.utilityCards.filter((card) => {
    if (card.requiresSharingLevel === 'emotional') {
      return state.sharingLevel === 'emotional';
    }
    if (card.requiresSharingLevel === 'care') {
      return state.sharingLevel === 'care' || state.sharingLevel === 'emotional';
    }
    return true;
  });
}
```

---

## 8. Confirmation-First Care Action

Fevio에서 care action은 기록만으로 확정되지 않는다.

특히 주사, 약, 민감한 시술 관련 action은 다음 세 값을 분리해야 한다.

```text
administered_by ≠ recorded_by ≠ confirmed_by_patient
```

파트너가 주사를 놓았을 수 있다.
파트너가 그 사실을 기록했을 수 있다.
그러나 환자가 confirm하지 않으면 확정된 care action이 아니다.

이 원칙은 Fevio의 trust ledger, user-confirmed care record, privacy-first care collaboration의 기초다.

---

## 9. Stage 4 Language Safety

Stage 4의 UI label은 **"수정 준비"**로 고정한다.

이 단계는 파트너의 참여가 중요할 수 있지만, 화면은 성적 부담이나 수치심을 만들면 안 된다.
Fevio는 이 단계를 성적 사건이 아니라 의료적 준비와 일정 확인, privacy-respecting collaboration으로 다룬다.

### 금지 표현

```text
정자 추출
남편이 해야 하는 날
성공적으로 채취
남성 파트너의 과제
```

### 권장 표현

```text
수정 준비
필요한 준비와 시간을 함께 확인합니다
결과 알림을 함께 확인합니다
조용한 협력
```

---

## 10. Demo = Product Structure Skeleton

Fevio demo는 static mock screen이 아니다.
최소한의 실제 상태 기반 interactive prototype이어야 한다.

Demo는 지금 local state로 동작해도 된다.
하지만 데이터 구조는 Supabase-ready여야 한다.

반드시 포함해야 하는 구조:

```text
DemoState
demoReducer
UtilityCardState
ActionLog
UtilityCardRenderer
PartnerProjection
```

데모에서 stage를 바꾸면 utility card set이 바뀌어야 한다.
카드를 완료하면 상태가 바뀌어야 한다.
공유 범위를 바꾸면 파트너 화면이 달라져야 한다.
중앙 Shared Care State panel은 현재 stage, sharing level, 완료 action count를 반영해야 한다.

---

## 11. Vercel-Visible = Done

Fevio에서 "완료"의 기준은 코드 작성이나 테스트 통과가 아니다.

> Vercel URL을 열었을 때 product surface가 실제로 보이고, 조작되고, 상태가 바뀌어야 done이다.

테스트 통과와 typecheck 통과는 필요조건이다.
충분조건은 아니다.

모든 issue의 acceptance criteria는 다음 형식을 가져야 한다.

```text
URL → Action → Visible Result
```

예시:

```text
/demo?mode=stage&stage=7 접속
→ 공유 범위를 "다음 일정만"으로 변경
→ Partner 화면에서 hCG 수치가 숨겨지고 다음 검사일만 표시됨
```

---

## 12. Intro Landing Principle

Intro Landing은 장식용 landing page가 아니다.
IVF 7-stage care cycle을 처음 보는 사람에게 제품 구조를 설명하는 entry point다.

Intro orbit visual은 다음 원칙을 따른다.

```text
IVF_STAGES 데이터를 재사용한다.
7개 node는 clickable navigation이다.
각 node 클릭 시 해당 stage demo로 진입한다.
중앙에는 Fevio Care State Engine과 CTA를 둔다.
CTA는 Stage 2 demo로 진입한다.
Animation은 hover/glow 수준만 허용한다.
```

Intro footer copy:

```text
Same app. Shared state. Different experience.
```

---

## 13. North Star UX Rules

### 1. 설명보다 실행

사용자가 읽어야 할 문장을 줄이고, 바로 누를 수 있는 action을 제공한다.

### 2. 환자에게 통제권

민감 정보, 감정 기록, 결과 수치, 공유 범위는 환자가 결정한다.

### 3. 파트너에게 구체적 행동

파트너에게 "잘 도와주세요"라고 말하지 않는다.
대신 지금 할 수 있는 준비, 동행, 관찰, 확인 action을 보여준다.

### 4. 같은 정보, 다른 역할 언어

같은 care state라도 환자와 파트너가 보는 UI는 달라야 한다.

### 5. 의료 판단 금지

Fevio는 진단, 처방, 결과 해석, 성공률 예측을 하지 않는다.
Fevio는 병원 지시를 구조화하고, 사용자가 놓치지 않도록 돕는다.

### 6. 과잉 위로 금지

Fevio의 톤은 절제된 따뜻함이다.
감정을 과장하지 않고, 불안을 가볍게 다루지 않는다.

### 7. 민감한 단계는 더 적게 말한다

Stage 4, Stage 7처럼 민감한 단계일수록 문장을 줄이고, 공유 제어와 다음 행동을 명확히 한다.

---

## 14. Non-Negotiables

Fevio에서 절대 타협하지 않는 원칙:

```text
No static fake screen.
No long explanatory phone copy.
No partner copy-paste view.
No medical judgment.
No forced sharing.
No careless wording around sensitive reproductive actions.
No "done" without Vercel-visible product surface.
```

---

## 15. Product Definition

Fevio는 난임 치료를 한 사람의 기억과 전달 능력에 의존하는 과정에서, 부부가 함께 관리할 수 있는 shared care state로 전환한다.

환자는 자신의 치료 상태를 기록하고 통제한다.
파트너는 같은 상태를 바탕으로 지금 도울 수 있는 행동을 본다.
앱은 IVF 7단계 사이클 내내 시기에 맞는 utility UI를 생성한다.

**Fevio is a state-driven Generative UI Care OS for IVF couples.**

---

## 기존 PRD와의 정합성

이 North Star는 기존 PRD를 대체하지 않는다. 기존 PRD의 상위 제품 철학이다.

PRD가 정의한 핵심 문제:
- 일정 복잡성
- 치료 프로토콜 복잡성
- 부부 간 정보 비대칭
- 감정적 소진

PRD의 해결 방향:
- 일정 관리 · 약/주사 관리 · 부부 공유 · 시술 기록

North Star는 이를 **state-driven Generative UI + partner projection + utility-first care interface**로 구현하는 원칙을 정의한다.

특히 PRD의 "실시간 정보 공유 + 남편용 간결한 액션 가이드 필요"와 "부부 역할 가시화"는 Partner Projection 원칙(섹션 7)과 직접 연결된다.
