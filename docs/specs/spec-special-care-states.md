# Spec: Special Care States (Two-Week Wait & Result Protection)

## 목적

이식 후 피검 전(`two_week_wait_day`)과 피검 결과 직후(`result_protection_day`)는 정보 과부하와 감정적 부담이 가장 큰 구간이다. 이 두 상태는 별도의 surface 빌더로 구성되며, 금지 카피 패턴을 도메인에서 명시적으로 차단한다.

## 범위

- Two-Week Wait anchor 계산 (`buildTwoWeekWaitAnchor`)
- Result Protection surface 계산 (`buildResultProtectionSurface`)
- 금지 카피 패턴 검사
- 파트너 안내 문구

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/two-week-wait.ts` | `buildTwoWeekWaitAnchor`, tone, 금지 패턴 |
| `src/domain/result-protection.ts` | `buildResultProtectionSurface`, 금지 패턴 |
| `src/features/adaptive-home/two-week-wait-home.tsx` | Two-Week Wait 홈 UI |
| `src/features/adaptive-home/result-protection-home.tsx` | Result Protection 홈 UI |

---

## Two-Week Wait Anchor

### 입력

```ts
type TwoWeekWaitAnchorInput = {
  transferDate: string;  // ISO date
  betaDate: string;      // 피검일
  today: string;         // ISO date
};
```

### 출력 (`TwoWeekWaitAnchor`)

```ts
{
  dayPostTransfer: number;   // 이식 후 D+N
  daysUntilBeta: number;     // 피검까지 N일
  title: `이식 후 D+${N} · 피검까지 ${M}일`;
  tone: TwoWeekWaitTone;     // 'settling' | 'steady' | 'nearing_beta'
  explanation: string;       // 구간별 안내 문구
  judgementBoundary: '오늘 판단하지 않아도 되는 날이에요. 증상은 기록만 하고 결론은 병원 확인까지 미뤄둘게요.';
  primaryAction: '오늘은 기록만 남기기';
  checkInPrompts: ['몸 상태 한 줄', '마음 상태 한 줄'];
}
```

### Tone 기준

```
dayPostTransfer ≤ 3 → 'settling'
dayPostTransfer ≤ 7 → 'steady'
그 외              → 'nearing_beta'
```

### 구간별 안내 문구

| 구간 | explanation |
|---|---|
| D+0–3 | 초기 며칠은 몸을 설득하려 애쓰지 않아도 되는 시간이에요. 정해진 루틴을 유지하는 것이 전부예요. |
| D+4–7 | 증상으로 결론을 내리지 않는 연습이 필요한 구간이에요. 기록은 남기고 해석은 보류해요. |
| D+8+ | `피검까지 ${M}일 남았어요. 결과는 병원에서 확인하고, 오늘은 루틴과 휴식만 지켜요.` |

### 금지 카피 패턴

```ts
const FORBIDDEN_COPY_PATTERN = /임테기|착상 성공|실패|다음 cycle|증상 검색/u;
isForbiddenTwoWeekWaitCopy(copy): boolean
```

LLM 또는 앱이 생성한 문구가 이 패턴에 매칭되면 사용 금지.

---

## Result Protection Surface

### 입력

```ts
type ResultProtectionSurfaceInput = {
  betaRecordedAt: string;
  now: string;
  reviewOpenedAt?: string | null;
};
```

### 출력 (`ResultProtectionSurface`)

```ts
{
  careDay: 'result_protection_day';
  isAlwaysFree: true;                    // 결제 게이트 없음
  heroCopy: '오늘은 아무것도 결정하지 않아도 됩니다. 결과를 받아든 직후의 하루는 보호받아야 해요.';
  primaryAction: '오늘은 결정하지 않기';
  quietNonMedicationNotifications: true; // 비복약 알림 조용히
  allowRoutineMedicationReminders: true; // 복약 리마인더만 유지
  reviewVisibility: 'hidden_until_user_opens' | 'open_by_user_request';
  reviewClosedLabel: '준비되면 이번 주기 기록 열어보기';
  partnerGuidance: '먼저 위로하거나 해결책을 말하기보다, 곁에 있고 필요한 일상만 조용히 도와주세요.';
}
```

`reviewOpenedAt`이 null/undefined이면 `reviewVisibility = 'hidden_until_user_opens'`.

### 금지 카피 패턴

```ts
const FORBIDDEN_COPY_PATTERN = /다음 cycle|다음 주기 준비|실패 원인|바로 다시|내 몸이/u;
isForbiddenResultProtectionCopy(copy): boolean
```

---

## 공통 원칙

- 두 상태 모두 **판단을 미루는 것이 목표**다.
- LLM 문구 생성 시 반드시 금지 패턴 검사를 통과해야 한다.
- 파트너 화면에 이 상태 특이적 문구가 그대로 노출되어선 안 된다.
- `result_protection_day`는 비복약 알림을 끄되, 복약 리마인더는 유지한다.

---

## URL-action-result

- `/home`에서 `result_protection_day`일 때 heroMessage는 "오늘은 아무것도 결정하지 않아도 됩니다"이고, 복약 외 알림은 조용히 된다.
- `/home`에서 `two_week_wait_day`일 때 D+N 타이틀과 피검까지 남은 일수가 표시되며, 체크인 프롬프트가 제공된다.
