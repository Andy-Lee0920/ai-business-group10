# Spec: Dynamic Home (Care Day 기반 홈 구성)

## 목적

confirmed 카드와 couple 상태를 기반으로 오늘의 치료 맥락(`CareDay`)을 결정론적으로 계산하고, 그에 맞는 홈 컨텍스트를 구성한다.

## 범위

- `CareDay` 열거형 (V1 카드 기반, V2 마일스톤 기반)
- `computeCareDay` — SLC 카드 기반 계산
- `computeCareDay V2` — 마일스톤 우선, 카드 override 지원
- `HomeContext` — 홈 메시지, 정렬된 카드 목록
- `HomeActionCard` — 안전 수준 + urgency copy 포함 카드 표현

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/care-cards.ts` | `computeCareDay` (V1) |
| `src/domain/home-composition.ts` | `computeHomeContext`, `computeHomeContextV2`, `HomeContext` |
| `src/domain/treatment-timeline.ts` | `computeCareDayV2` (V2, 마일스톤 기반) |
| `src/features/adaptive-home/` | care day별 홈 화면 컴포넌트 |

---

## `CareDay` 열거형

```ts
type CareDay =
  | 'onboarding'           // 첫 Capture 완료 전
  | 'clinic_day'           // 오늘 clinic_visit 카드 있음
  | 'injection_day'        // 오늘 injection 카드 있음
  | 'waiting_day'          // 대기 모드 (수동 진입 또는 카드 없음)
  | 'two_week_wait_day'    // 이식 후 피검 전
  | 'result_protection_day' // 피검 결과 직후
  | 'routine_day';         // 기타
```

---

## V1: `computeCareDay(input)` — 카드 기반

```
hasEverCaptured = false          → 'onboarding'
manuallySelectedCareDay = 'waiting_day' → 'waiting_day'
오늘 injection 카드 있음          → 'injection_day'
오늘 clinic_visit 카드 있음       → 'clinic_day'
오늘 카드 있음 (기타)             → 'routine_day'
향후 카드 있음 (today 이후)       → 'waiting_day'
                                  → 'routine_day'
```

`hasEverCaptured = couple_states.first_capture_completed_at IS NOT NULL`

---

## V2: `computeHomeContextV2` — 마일스톤 우선

`computeCareDayV2(milestones, todayCards, today)` 반환 타입:

```ts
type CareSurfaceContextV2 = {
  phaseCareDay: TimelineCareDay;   // 마일스톤에서 파생된 phase
  surfaceCareDay: TimelineCareDay; // 실제 표시 care day (override 반영)
  foregroundCards: CareActionCard[];
  overrideReason: CareSurfaceOverrideReason;
  proximityDays?: number;
};
```

Override 우선순위:
1. 오늘 trigger 주사 카드 → `injection_day` (`reason: 'trigger_shot'`)
2. 오늘 채취·이식·시술 카드 → `clinic_day` (`reason: 'procedure_time_gate'`)
3. 마일스톤 기반 phase
4. 카드 타입 기반 inference

---

## `HomeContext` 타입

```ts
type HomeContext = {
  careDay: CareDay;
  phaseCareDay?: TimelineCareDay;
  surfaceCareDay?: TimelineCareDay;
  overrideReason?: CareSurfaceOverrideReason;
  proximityDays?: number;
  generatedAt: string;
  primaryMessage: string;
  cards: HomeActionCard[];
  roleIntent?: RoleBasedHomeIntent;
  onboardingQuickCaptureDone?: boolean;
  partnerConnected?: boolean;
};
```

---

## `HomeActionCard` 정렬 규칙

1. `displaySafetyLevel`: `critical` > `time_sensitive` > `normal`
2. 동점이면 `scheduledAt` 오름차순 (빠른 시간 먼저)
3. `scheduledAt` 없는 카드는 마지막

---

## 홈 primaryMessage 사전

```
onboarding         → '오늘 필요한 케어를 먼저 정리해요.'
injection_day      → '오늘은 시간과 준비물이 흔들리지 않도록, 확인한 내용만 먼저 놓을게요.'
clinic_day         → '방문 전에는 지난 흐름과 다음 안내를 한 번에 차분히 확인해요.'
waiting_day        → '오늘은 더 많이 확인하기보다, 필요한 일정만 조용히 붙잡아 둘게요.'
two_week_wait_day  → '피검 전까지는 기록은 남기고 판단은 잠시 미뤄둘게요.'
result_protection_day → '오늘은 아무것도 결정하지 않아도 됩니다. 필요한 알림만 조용히 남겨둘게요.'
routine_day        → '오늘 해야 할 것과 쉬어도 되는 것을 나눠서 보여드릴게요.'
```

---

## care day별 홈 컴포넌트

| CareDay | 컴포넌트 |
|---|---|
| injection_day | `features/adaptive-home/injection-day-home.tsx` |
| clinic_day | `features/adaptive-home/clinic-day-home.tsx` |
| waiting_day | `features/adaptive-home/waiting-day-home.tsx` |
| two_week_wait_day | `features/adaptive-home/two-week-wait-home.tsx` |
| result_protection_day | `features/adaptive-home/result-protection-home.tsx` |
| routine_day | `features/adaptive-home/routine-day-home.tsx` |

---

## URL-action-result

- `/home`에서 첫 로그인 사용자는 `onboarding` care day 화면을 본다.
- `/home`에서 오늘 injection 카드가 있으면 injection_day 화면을 본다.
- `/home`에서 사용자가 대기 모드를 수동 확정하면 `waiting_day` 화면으로 전환된다.
