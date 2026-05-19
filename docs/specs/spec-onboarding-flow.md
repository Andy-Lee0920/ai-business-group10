# Spec: Onboarding Flow

## 목적

신규 사용자가 Privacy Gate 동의 → 역할 선택 → 첫 일정 등록까지 완료하여 홈 화면의 care day가 `onboarding`에서 실제 케어 상태로 전환되게 한다.

## 범위

- 온보딩 스텝 순서 및 분기
- 동의 항목 (4가지)
- 첫 일정 인터뷰 draft 생성
- IVF 단계 추론 (`inferStageFromCareItem`)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/features/onboarding/onboarding-flow.ts` | 스텝 순서, 동의, 스케줄 draft 빌더 |
| `src/domain/onboarding-care-state.ts` | IVF 단계 추론, stage → care day 매핑 |
| `src/features/onboarding/onboarding-screen.tsx` | 온보딩 UI |
| `src/features/onboarding/onboarding-ui.tsx` | 온보딩 UI 컴포넌트 |

---

## 스텝 순서

```ts
type OnboardingStep =
  | 'brand_intro'
  | 'role_selection'
  | 'patient_consent'
  | 'partner_consent'
  | 'first_schedule_interview'
  | 'first_schedule_confirm'
  | 'home';
```

분기:
- `role_selection` → role이 `partner`이면 `partner_consent` → `home`
- `role_selection` → role이 `patient`이면 `first_schedule_interview` → `first_schedule_confirm` → `home`

`patient_consent` 스텝은 현재 flow에서 `first_schedule_interview`로 바로 넘어간다 (`nextOnboardingStep` 참고).

---

## 동의 항목 (4가지)

```ts
const ONBOARDING_CONSENT_CHECKS = [
  { key: 'privacy_boundary',      label: '개인정보 수집·이용에 동의합니다.' },
  { key: 'sensitive_data',        label: '민감정보 처리에 동의합니다.' },
  { key: 'clinical_boundary',     label: 'Fevio는 의료 판단을 하지 않음을 이해했습니다.' },
  { key: 'input_assist_boundary', label: 'AI/입력 보조는 자동 저장하지 않음을 이해했습니다.' },
];
```

`hasRequiredConsentChecks(checks)` → 4개 모두 true여야 Privacy Gate 통과.

---

## 첫 일정 칩

```ts
const FIRST_SCHEDULE_CHIPS = [
  { id: 'injection',  label: '주사',      scheduleType: 'injection'  },
  { id: 'medication', label: '약 복용',   scheduleType: 'medication' },
  { id: 'clinic',     label: '병원 방문', scheduleType: 'clinic'     },
];
```

---

## 첫 일정 Draft 타입

```ts
type FirstScheduleDraft = {
  type: ScheduleType;
  title: string;
  scheduledAt: string;
  dose: string | null;
  unit: string | null;
  medicationId: string | null;
  optionalMemo: string | null;
  source: 'onboarding_interview';
  inputAssist: {
    source: 'none' | 'aliases' | 'llm';
    matchedMedicationId: string | null;
    matchedMedicationLabel: string | null;
    requiresUserConfirmation: true;  // 항상 true
  };
};
```

`buildFirstScheduleDraft()` — title 또는 scheduledAt이 비어 있으면 null 반환.

---

## IVF 단계 추론

`inferStageFromCareItem({ selectedIntent, rawText })` — 아래 두 소스를 결합해 `IvfStage`를 추론한다.

1. **intent 기반**: `INTENT_STAGE` 테이블 (e.g. `medication` → `ovarian_stimulation`)
2. **키워드 기반**: `rawText`에서 regex 패턴 매칭

keywordStage와 intent stage가 불일치하면:
- `unknown` intent → keyword 우선
- `result_waiting` intent → intent 유지 (ambiguous)
- 기타 → intent 유지, confidence 강등

### IvfStage → CareDay 매핑

```ts
careDayForOnboardingStage(stage):
  ovarian_stimulation → injection_day
  embryo_transfer     → two_week_wait_day
  pregnancy_test      → result_protection_day
  embryo_culture      → waiting_day
  baseline_testing / egg_retrieval / fertilization → clinic_day
```

---

## URL-action-result

- `/onboarding`에서 4개 동의 후 첫 일정을 확정하면 홈에서 `onboarding`이 아닌 해당 care day로 전환된다.
- `/onboarding`에서 파트너 역할 선택 시 동의만 하고 홈으로 이동한다 (일정 인터뷰 없음).
