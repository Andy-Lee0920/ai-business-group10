# Dynamic Home & CareDay 상태 머신

> "The home screen is a function of care context, not a static dashboard."
> — CLAUDE.md

## Care Day 5가지 상태

```ts
type CareDay =
  | "onboarding"    // 첫 로그인 후 capture 완료 전
  | "clinic_day"    // 오늘 clinic_visit 카드 있음
  | "injection_day" // 오늘 injection 카드 있음
  | "waiting_day"   // 수동 진입, 결과 대기 상태
  | "routine_day";  // 특별 카드 없는 일반 날
```

## computeCareDay() 결정 로직

```ts
export function computeCareDay(input: CareContextInput): CareDay {
  if (!input.hasEverCaptured) return "onboarding";
  if (input.manuallySelectedCareDay === "waiting_day") return "waiting_day";
  if (input.todayCards.some(c => c.card_type === "injection")) return "injection_day";
  if (input.todayCards.some(c => c.card_type === "clinic_visit")) return "clinic_day";
  return "routine_day";
}
```

**중요한 전제들:**
- `hasEverCaptured = couple_states.first_capture_completed_at IS NOT NULL`
- `injection_day`가 `clinic_day`보다 우선 (injection이 더 시간 민감)
- `routine_day`는 첫 로그인 상태가 아님 — `onboarding`이 첫 상태
- criticality는 care_day 결정에 관여하지 않음

## Onboarding Home

조건: `hasEverCaptured = false` AND `confirmedCards.length = 0`

렌더링 컴포넌트:
1. `PostVisitCaptureCard` — 병원 메모 입력 유도
2. `PrivacyBoundaryReminderCard` — 의료 경계 안내
3. `GentleCheckInCard` — 부드러운 시작 안내

## Waiting Day 진입

Waiting Day는 자동 전환되지 않는다. 사용자가 명시적으로 선택해야 한다.

**제안 조건:**
```ts
function shouldSuggestWaitingDay(input): boolean {
  return (
    input.hasEverCaptured === true &&
    input.todayCards.length === 0 &&
    input.manuallySelectedCareDay !== "waiting_day" &&
    hasRecentWaitingSignal(input) &&
    !isDismissedRecently(input.waiting_mode_dismissed_until)
  );
}
```

대기 신호 키워드: "결과 대기", "피검", "임신 테스트", "배아 이식", "이식 후", "기다리"

`WaitingModeSuggestCard` 카피:
> "결과를 기다리는 중이신가요? 대기 모드로 전환하면 오늘 화면을 조금 더 조용하게 정리하고, 꼭 필요한 확인만 남겨둘 수 있어요."

## State-driven Generative UI: TPO specificity-first 슬롯

홈 화면은 6개 고정 슬롯으로 구성된다. AI가 임의로 레이아웃을 생성하지 않는다.

```ts
type CareSurfaceSlot = 'hero' | 'primary_card' | 'secondary_card' | 'stats_row' | 'checklist' | 'partner';
```

슬롯별 사용 가능한 컴포넌트:
```ts
type CareSurfaceComponent =
  | 'CareMomentRing'       // critical time gate (intensity 1.0)
  | 'CompactHeroGreeting'  // default/waiting hero
  | 'MissionCardPair'      // primary + partner cards
  | 'QuickStatRow'         // stats
  | 'QuietChecklist'       // low-priority items
  | 'PartnerConnectBar'    // partner connection prompt
  | null;                  // slot suppressed
```

**누적 점수 방식을 거부한 이유:** 약한 신호 2개가 결합해 accidental urgency를 만들 수 있음. IVF care surface는 예측 가능해야 한다.

## CSS Intensity 계약

`--fevio-surface-intensity`는 장식이 아니라 행동 신호다.

| intensity | 의미 | 시각적 동작 |
|---|---|---|
| `1.0` | critical time gate | strongest bloom, stronger depth |
| `0.65` | elevated care action | medium bloom/depth |
| `0.2` | waiting/quiet | low bloom, softer grain |
| `0.15` | confirmed cards 없음 | near-neutral quiet surface |

`prefers-reduced-motion` 반드시 존중. intensity 변경은 static CSS 값.

## Allowed vs Forbidden Components

### Allowed (v1.0)
```ts
type AllowedComponentId =
  | "PostVisitCaptureCard"
  | "PrivacyBoundaryReminderCard"
  | "GentleCheckInCard"
  | "TodayTop3ActionCard"
  | "ClinicVisitCard"
  | "InjectionTimeCard"
  | "PartnerAssistCard"
  | "PartnerConfirmationCard"
  | "WaitingModeSuggestCard"
  | "MinimalNextClinicCard"
  | "PartnerSupportPromptCard"
  | "RoutineNextStepCard"
  | "NoActionNeededCard";
```

### Forbidden (절대 렌더링 금지)
```
TreatmentRecommendationCard
DoseAdjustmentCard
DiagnosisPredictionCard
EmbryoQualityJudgmentCard
SuccessRatePredictionCard
SymptomRiskAssessmentCard
```

## CycleEvent State Machine과의 관계

Dynamic Home은 현재 `computeCareDayV2()`를 fallback으로 사용한다. 장기적으로는 CycleEvent `reduceCycleState()`의 `confirmedPhase`로 마이그레이션된다.

**규칙:** home, partner, notification은 오직 `confirmedPhase`만 읽는다. `predictedPhase`, `suggestedPhase`는 soft hint로만 표시 가능.

## ComponentTree 계약

```ts
type ComponentTree = {
  schema_version: "care_home_component_tree.v1";
  role: "primary_user" | "partner";
  care_day: CareDay;
  generated_at: string;
  components: ComponentNode[];
};
```

이 tree는 서버에서 생성되고 클라이언트는 렌더링만 담당한다. 클라이언트가 컴포넌트 선택 로직을 가지면 안 된다.

---

**관련 페이지:** [06-care-loop-architecture.md](06-care-loop-architecture.md) | [07-data-model.md](07-data-model.md) | [10-implementation-status.md](10-implementation-status.md)
