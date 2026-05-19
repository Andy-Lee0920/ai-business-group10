# Spec: Clinic Guide Interview (병원 방문 후 업데이트)

## 목적

병원 방문 후 사용자가 들은 내용을 단계별 인터뷰 형식으로 수집하고 `ClinicUpdate` draft를 생성한다. AI 보조가 가능하지만 모든 결과는 사용자 확인 후에만 저장된다.

## 범위

- 6단계 인터뷰 flow (`ClinicGuideStep`)
- 결정론적 fallback 응답 (`buildClinicGuideFallbackResponse`)
- AI 응답 정규화 (`normalizeClinicGuideResponse`)
- `ClinicUpdate` draft 구조
- AI 경계: 허용/금지 행동

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/clinic-guide-interview.ts` | 인터뷰 도메인 순수 함수 |
| `src/domain/clinic-guide-medication-normalizer.ts` | 약명 정규화 |
| `src/types/clinic-guide.types.ts` | 타입 정의 |
| `src/features/clinic-update/clinic-update-form.tsx` | UI |

---

## 인터뷰 단계 (`ClinicGuideStep`)

```ts
const CLINIC_GUIDE_STEPS = [
  'same_medication',   // 약이 그대로인지 바뀌었는지
  'add_medication',    // 새로 추가된 약 이름
  'medication_days',   // 며칠치 처방
  'next_visit',        // 다음 방문일
  'trigger_plan',      // 트리거 주사 계획
  'memo',              // 자유 메모
];
```

### 단계 전이 규칙

```
same_medication:
  same_medication === false → 'add_medication'
  otherwise                → 'medication_days'
add_medication             → 'medication_days'
medication_days            → 'next_visit'
next_visit                 → 'trigger_plan'
trigger_plan               → 'memo'
memo                       → null (완료)
```

---

## `ClinicUpdate` draft 구조

```ts
type ClinicUpdate = {
  same_medication: boolean | null;
  added_medication_ids: string[];
  medication_days: number | null;     // 1–30 클램프
  next_visit_at: string | null;       // ISO timestamp
  trigger_plan: 'today' | 'tomorrow' | 'not_yet' | 'unknown' | null;
  memo: string | null;
};
```

---

## Fallback 질문 사전

```
same_medication:  '오늘 병원에서 약이 그대로인지, 바뀌었는지만 먼저 확인할게요.'
add_medication:   '새로 받은 약이 있다면 이름만 적어주세요. 없으면 없다고 답해도 괜찮아요.'
medication_days:  '며칠치 처방을 받았나요?'
next_visit:       '다음 방문일을 들었다면 날짜를 알려주세요.'
trigger_plan:     '트리거 주사 계획을 들었나요? 오늘, 내일, 아직 미정 중에서 확인해 주세요.'
memo:             '마지막으로 병원에서 들은 내용을 그대로 메모해 주세요.'
```

---

## `buildClinicGuideFallbackResponse(request, fallbackReason?)`

결정론적으로 실행. AI 없이 항상 동작.

1. `inferDraft(step, userInput)` — 사용자 입력에서 draft 필드 추론
2. `mergeDraft(context, inferred)` — context와 병합
3. `resolveNextStep(step, userInput, draft)` — 다음 단계 결정
4. fallback 질문 + chips + warnings 반환

### `inferDraft` 추론 규칙

| Step | 추론 방식 |
|---|---|
| same_medication | `바뀌/변경/새/추가` → false; `그대로/같/유지/없` → true |
| medication_days | 숫자 추출 (1–30 클램프) |
| next_visit | `YYYY-MM-DD` 패턴 → `T09:00:00.000Z` |
| trigger_plan | `오늘/내일/미정/모르` 키워드 매핑 |
| memo | userInput 그대로 |

---

## `normalizeClinicGuideResponse(payload, request, fallbackReason?)`

AI Edge Function 응답 정규화.

유효성 조건:
- `payload.question`이 문자열이고 한국어 포함 (`/[가-힣]/`)
- `payload.draft`가 record 형식

실패 시 `buildClinicGuideFallbackResponse`로 자동 fallback.

반환:
```ts
{
  source: 'ai' | 'fallback';
  nextStep: ClinicGuideStep | null;
  question: string;
  chips: string[];
  draft: Partial<ClinicUpdate>;
  warnings: string[];
  requiresUserConfirmation: true;  // 항상 true
}
```

---

## AI 허용/금지 경계

### 허용 (Clinic Guide AI)

- 약품명 문자열 → medications 테이블 행 정규화
- 다음 인터뷰 질문 제안
- 사용자 입력 보조 (자동완성 힌트)
- draft 필드 채우기 (사용자 확인 필요)

### 금지 (Clinic Guide AI)

- 약 용량 추론 또는 확정
- 투약 시간 자동 결정
- 치료 단계 판단
- 의학적 조언 ("이 약을 맞아야 합니다" 류)
- 사용자 확인 없이 일정 자동 저장

`requiresUserConfirmation: true`는 항상 강제.

---

## URL-action-result

- `/clinic-update`에서 사용자가 단계별 응답을 완료하고 "저장 전 확인"을 누르면 draft 미리보기가 표시된다.
- 사용자가 확인 후 저장하면 `care_action_cards`에 반영된다.
- 저장 전에는 어떤 draft 데이터도 DB에 기록되지 않는다.

---

## 관련 결정

- `docs/01-product/prd-v1.0.md` §16.4 (Clinic Guide AI Boundary)
