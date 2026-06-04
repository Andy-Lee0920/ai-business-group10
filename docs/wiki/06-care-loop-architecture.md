# 핵심 케어 루프 아키텍처

> "The product is complete only when all five P0 screens are connected."
> — PRD v1.0 §20

## 전체 케어 루프

```text
Google OAuth
  ↓
Couple shell bootstrap (DB trigger)
  ↓
Privacy & Clinical Boundary Gate  ← 쓰기 경계
  ↓
Dynamic Home: onboarding state
  ↓
Post-Visit Capture
  ↓
Manual Line Split (또는 optional LLM-assisted draft)
  ↓
Action Split Review: 사용자가 각 후보를 분류
  ↓
Confirm  ← 실제 저장 시점
  ↓
CareActionCards 생성
  ↓
Dynamic Care Context Home 재구성
  ↓
Partner share link 생성
  ↓
Partner Action View: "오늘 도와줄 일" + 3초 폴링 실시간 동기화
```

## 5개 P0 화면

### Screen 1 — Privacy & Clinical Boundary Gate

**목적**: 실제 IVF 정보가 민감정보임을 고지하고 동의를 받는다.

필수 고지 내용:
- 민감정보 수집·이용 동의
- 파트너 공유 동의
- 보유·삭제 정책
- **의료 조언 아님 고지** ← 핵심
- 외부 AI 전송 여부 고지

**Blocking rule**: Privacy Gate 완료 전에는 어떤 sensitive row도 생성 불가.

### Screen 2 — Post-Visit Capture

**목적**: 사용자가 병원에서 들은 내용을 정리하지 않고 그대로 캡처하게 한다.

Microcopy:
> "잘 모르겠는 내용도 그대로 적어도 괜찮아요. 확인이 필요한 항목은 따로 표시됩니다."

Capture CTA 클릭 시: `visit_inputs` + `action_split_drafts` shell만 생성. split_candidates는 생성하지 않음.

### Screen 3 — Action Split Review

**목적**: 앱이 나눈 줄/문장 후보를 사용자가 빠르게 역할별로 분류한다.

4개 분류 버튼:
- 내 할 일
- 파트너에게 공유
- 병원에 확인
- 제외

**Confirm CTA**: 최종 classified candidates를 batch 저장 → care_action_cards 생성.

### Screen 4 — Dynamic Care Context Home

**목적**: confirmed card와 couple state를 기반으로 오늘의 치료 맥락에 맞는 홈 구성.

5가지 care_day: `onboarding` / `clinic_day` / `injection_day` / `waiting_day` / `routine_day`

### Screen 5 — Partner Action View

**목적**: 파트너가 앱 설치 없이 오늘 자신이 도와야 할 일을 읽고 확인.

- Google login 없음
- couple-level 7-day signed share link
- server-side token validation
- live server-filtered view

## Couple Shell Bootstrap

Google OAuth 직후 DB trigger로 자동 생성:

```sql
CREATE TRIGGER on_auth_user_created_init_couple
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.init_couple_for_new_user();
```

생성 순서:
1. `couples` row
2. `couple_members` primary_user row
3. `couple_members` partner placeholder row (user_id = NULL)
4. `couple_states` row

idempotent fallback: `GET /api/bootstrap/me`

## computeCareDay() — 홈 상태 결정 로직

```ts
export function computeCareDay(input: CareContextInput): CareDay {
  if (!input.hasEverCaptured) return "onboarding";
  if (input.manuallySelectedCareDay === "waiting_day") return "waiting_day";
  if (input.todayCards.some(c => c.card_type === "injection")) return "injection_day";
  if (input.todayCards.some(c => c.card_type === "clinic_visit")) return "clinic_day";
  return "routine_day";
}
```

중요한 전제:
- `hasEverCaptured = couple_states.first_capture_completed_at IS NOT NULL`
- `routine_day`가 첫 로그인 상태가 아님; `onboarding`이 첫 상태
- criticality는 care_day 결정에 영향 없음 (별도 `computeDisplaySafetyLevel()` 처리)

## inferCardType() — 카드 타입 결정

Deterministic keyword 규칙으로 타입 추론. LLM 판단 아님.

```ts
function inferCardType(text, assignedTo, userSelectedCardType?, suggestedCardType?): CardType {
  if (userSelectedCardType) return userSelectedCardType;  // 사용자 선택 우선
  if (assignedTo === "clinic_confirmation") return "clinic_confirmation";
  // keyword matching...
  if (suggestedCardType) return suggestedCardType;  // LLM 제안은 최후순위
  return "general_action";
}
```

우선순위: `사용자 선택 > deterministic keyword > LLM 제안 > general_action`

## Forbidden Components

홈 화면에 절대 렌더링되면 안 되는 컴포넌트들:

```ts
// 이것들은 AllowedComponentId에 포함되지 않음
TreatmentRecommendationCard    // 치료 추천
DoseAdjustmentCard             // 용량 조정
DiagnosisPredictionCard        // 진단 예측
EmbryoQualityJudgmentCard      // 배아 품질 판단
SuccessRatePredictionCard      // 성공률 예측
SymptomRiskAssessmentCard      // 증상 위험 평가
```

---

**관련 페이지:** [04-confirmation-first.md](04-confirmation-first.md) | [07-data-model.md](07-data-model.md) | [09-dynamic-home-careday.md](09-dynamic-home-careday.md)
