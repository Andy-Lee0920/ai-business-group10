# Spec: Care Surface Engine (규칙 기반 홈 구성)

## 목적

JSON 규칙 파일에서 로드한 `CareSurfaceRule[]`을 `FevioSurfaceContext`에 대해 평가하고, 슬롯별 우승 컴포넌트를 결정한다. 데이터 계층(care day, milestone)과 렌더링 계층(컴포넌트 선택)을 분리한다.

## 범위

- `CareSurfaceRule` 평가 (`evalCareSurfaceCondition`)
- 슬롯별 우선순위 결합 (`computeCareSurface`)
- 추적 trace 생성 (`CareSurfaceTraceEntry[]`)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/care-surface-engine.ts` | 핵심 평가 엔진 |
| `src/domain/care-surface-rule.schema.ts` | Zod 스키마 |
| `src/types/care-surface.types.ts` | 타입 정의 |
| `config/care-surface-rules.json` | 규칙 데이터 |

---

## 슬롯 목록

```ts
type CareSurfaceSlot =
  | 'hero'
  | 'primary_card'
  | 'secondary_card'
  | 'stats_row'
  | 'checklist'
  | 'partner';
```

기본 슬롯 컴포넌트:

```ts
const DEFAULT_SLOTS = {
  hero:          'CompactHeroGreeting',
  primary_card:  'MissionCardPair',
  secondary_card: null,
  stats_row:     'QuickStatRow',
  checklist:     'QuietChecklist',
  partner:       'PartnerConnectBar',
};
```

---

## `FevioSurfaceContext` 필드

규칙 조건은 이 context 필드들에 대해 평가된다. (타입은 `src/types/care-surface.types.ts` 참고)

주요 필드 예시:
- `careDay` (string)
- `proximityDays` (number)
- `partnerConnected` (boolean)
- `hasActiveInjectionCard` (boolean)

---

## `CareSurfaceRule` 구조

```ts
type CareSurfaceRule = {
  id: string;
  slot: CareSurfaceSlot;
  conditions: CareSurfaceCondition[];
  component: CareSurfaceComponent;  // null이면 슬롯 suppress
  priority: number;
  intensity: number;           // 0–1, 배경 cinematic intensity
  momentCopy?: string;
};

type CareSurfaceCondition = {
  field: keyof FevioSurfaceContext;
  op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'exists';
  value: string | number | boolean | null;
};
```

---

## `computeCareSurface(context, rules)` 알고리즘

```
1. 모든 규칙 중 conditions를 모두 만족하는 candidates 필터링
2. 특이도(조건 개수 내림차순) → priority 오름차순으로 정렬
3. 슬롯별 첫 번째 winner만 채택 (슬롯당 최대 1개 규칙)
4. winner의 component가 null이면 해당 슬롯 suppress
5. intensity = winner 중 최댓값 (최소 0.15)
6. momentCopy = winner 중 첫 번째 string 값
```

반환:

```ts
type CareSurfaceComposition = {
  slots: Record<CareSurfaceSlot, CareSurfaceComponent>;
  intensity: number;
  suppressedSlots: CareSurfaceSlot[];
  appliedRules: string[];
  momentCopy?: string;
  trace: CareSurfaceTraceEntry[];
};
```

---

## `evalCareSurfaceCondition(context, condition)`

| op | 의미 |
|---|---|
| `eq` | 값 동등 |
| `neq` | 값 불일치 |
| `lt` / `lte` | 숫자 비교 |
| `gt` / `gte` | 숫자 비교 |
| `exists` | null/undefined 아님 |

숫자 비교는 context 필드와 condition.value 모두 number일 때만 true.

---

## Trace

각 규칙에 대해 아래 정보를 기록한다:

```ts
type CareSurfaceTraceEntry = {
  ruleId: string;
  slot: CareSurfaceSlot;
  matched: boolean;    // candidate였는가
  selected: boolean;   // winner였는가
  specificity: number;
  priority: number;
  intensity: number;
};
```

디버그/테스트에 활용. 프로덕션 UI에는 노출하지 않는다.
