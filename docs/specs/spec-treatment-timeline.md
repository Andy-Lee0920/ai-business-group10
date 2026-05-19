# Spec: Treatment Timeline & Cycle State Machine

## 목적

IVF 치료 주기를 이벤트 소싱 방식으로 관리한다. 마일스톤(`TreatmentMilestone`) 또는 사이클 이벤트(`CycleEvent`)로부터 현재 치료 phase를 결정하고, care day를 파생한다.

## 범위

- `TreatmentMilestone` 기반 care day 파생 (`computeCareDayV2`)
- `CycleEvent` 기반 phase 상태기계 (`reduceCycleState`)
- IVF phase → care day 매핑
- Trigger/시술 Override

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/treatment-timeline.ts` | `computeCareDayV2`, milestone 파생 |
| `src/domain/cycle-state-machine.ts` | `reduceCycleState`, event → phase |
| `src/types/treatment-timeline.types.ts` | `TreatmentMilestone`, `TimelineCareDay` 타입 |
| `src/types/cycle-event.types.ts` | `CycleEvent`, `CyclePhaseState` 타입 |

---

## `TimelineCareDay`

```ts
type TimelineCareDay =
  | 'injection_day'
  | 'clinic_day'
  | 'waiting_day'
  | 'two_week_wait_day'
  | 'result_protection_day'
  | 'routine_day';
```

---

## `TreatmentMilestoneKind`

```ts
type TreatmentMilestoneKind =
  | 'stimulation_start'
  | 'trigger_shot'
  | 'egg_retrieval'
  | 'embryo_transfer'
  | 'result_day';
```

### Milestone → CareDay 매핑

```
stimulation_start / trigger_shot → injection_day
egg_retrieval:
  daysSince === 0 → clinic_day
  daysSince > 0   → waiting_day
embryo_transfer:
  daysSince === 0 → clinic_day
  daysSince > 0   → waiting_day
result_day:
  daysSince === 0 → clinic_day
  daysSince > 0   → routine_day
```

---

## `computeCareDayV2(milestones, todayCards, today)`

```
1. milestones에서 today 이전의 가장 최근 마일스톤으로 phaseCareDay 파생
2. todayCards에서 trigger/procedure override 탐색
3. override 있으면 surfaceCareDay = override.careDay
4. 없으면 surfaceCareDay = phaseCareDay
5. foregroundCards = 카드 rank 내림차순 정렬
```

### 카드 Rank

```
injection + trigger 키워드 → 40
clinic_visit + 시술 키워드  → 35
injection (일반)            → 30
user_marked_important       → 20
clinic_visit (일반)         → 10
기타                        → 0
```

Trigger 패턴: `트리거|오비드렐|ovidrel|데카펩틸|decapeptyl|난포터지는|trigger`
시술 패턴: `채취|이식|시술|수술|opu|transfer|retrieval`

---

## `IvfPhase` (Cycle State Machine)

```ts
type IvfPhase =
  | 'consultation' | 'period' | 'stimulation' | 'trigger_wait'
  | 'follicle_monitoring' | 'retrieval_scheduled' | 'retrieval_done'
  | 'embryo_culture' | 'freeze_all' | 'frozen_transfer_wait'
  | 'frozen_transfer_preparation' | 'transfer_scheduled' | 'two_week_wait'
  | 'beta_wait' | 'beta_followup' | 'ultrasound_wait'
  | 'result_protection' | 'cycle_cancelled' | 'cycle_closed';
```

---

## `reduceCycleState(events)` — 이벤트 소싱

이벤트를 날짜 오름차순 정렬 후 `applyCycleEvent`를 순차 적용한다.

초기 상태: `{ confirmedPhase: 'consultation', confidence: 'low', evidence: [] }`

### 주요 이벤트 → Phase 전이

| 이벤트 | confirmedPhase | predictedPhase |
|---|---|---|
| `period_started` | `period` | — |
| `stimulation_started` | `stimulation` | — |
| `follicle_scan_recorded` | `follicle_monitoring` | `trigger_wait` (suggested) |
| `trigger_scheduled` | `trigger_wait` | `retrieval_scheduled` |
| `retrieval_done` | `retrieval_done` | `embryo_culture` |
| `freeze_all_decided` | `freeze_all` | `frozen_transfer_wait` |
| `embryo_transfer_done` | `two_week_wait` | `beta_wait` |
| `beta_test_recorded` positive | `ultrasound_wait` | — |
| `beta_test_recorded` negative | `result_protection` | — |
| `beta_test_scheduled` (in two_week_wait) | two_week_wait 유지, predicted → `beta_wait` | |

---

## `careDayForConfirmedPhase(phase)` — Phase → TimelineCareDay

```
stimulation / trigger_wait                                      → injection_day
follicle_monitoring / retrieval_scheduled / transfer_scheduled / beta_wait → clinic_day
two_week_wait                                                   → two_week_wait_day
result_protection                                               → result_protection_day
embryo_culture / freeze_all / frozen_transfer_wait / beta_followup → waiting_day
기타                                                            → routine_day
```

---

## 관련 결정

- `docs/04-decisions/0008-treatment-timeline-milestone-first.md`
- `docs/04-decisions/0011-cycle-event-state-machine.md`
- `docs/04-decisions/0009-state-driven-generative-ui.md`
