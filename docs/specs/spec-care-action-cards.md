# Spec: CareActionCard 모델

## 목적

사용자가 확정한 병원 안내 항목을 `care_action_cards` row로 표현한다. 카드는 진단·처방·용량 판단이 아니라 사용자가 확인한 실행 지시다.

## 범위

- `CareActionCard` 타입 정의
- `CardType` 추론 (`inferCardType`)
- `DisplaySafetyLevel` 계산 (`computeDisplaySafetyLevel`)
- 리마인더 fallback 상태 (`computeReminderFallbackState`)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/types/care-cards.types.ts` | 타입 정의 |
| `src/domain/care-cards.ts` | 추론 함수, 안전 수준 계산 |
| `src/domain/line-split.ts` | `inferCardType` re-export |

---

## 타입 정의

```ts
type CardType =
  | 'injection' | 'medication' | 'clinic_visit' | 'clinic_confirmation'
  | 'partner_support' | 'record' | 'general_action';

type AssignedTo =
  | 'my_action' | 'partner_action' | 'clinic_confirmation' | 'excluded';

type CareDay =
  | 'onboarding' | 'clinic_day' | 'injection_day' | 'waiting_day'
  | 'two_week_wait_day' | 'result_protection_day' | 'routine_day';

type DisplaySafetyLevel = 'normal' | 'time_sensitive' | 'critical';

type CareCardStatus =
  | 'confirmed' | 'completed' | 'dismissed' | 'revoked' | 'superseded' | 'archived';

type CareActionCard = {
  id: string;
  couple_id: string;
  created_by: string;
  assignee_role: 'primary_user' | 'partner' | 'both';
  card_type: CardType;
  title: string;
  description: string | null;
  source_text: string;
  scheduled_at: string | null;
  care_date: string | null;
  status: CareCardStatus;
  confirmation_required: boolean;
  user_marked_important: boolean;
  partner_visible: boolean;
  revision: number;
  prescription_photo_url?: string | null;
  prescription_capture_status?: 'photo_attached' | 'manual_fallback' | 'photo_failed' | null;
  administered_by?: 'self' | 'partner' | 'clinic' | null;
};
```

---

## `inferCardType(text, assignedTo, userSelectedCardType?, suggestedCardType?)`

우선순위:
1. `userSelectedCardType` (사용자 직접 선택) → 즉시 반환
2. `assignedTo === 'clinic_confirmation'` → `'clinic_confirmation'`
3. 키워드 매칭 (우선순위 순): `injection` → `medication` → `clinic_visit` → `partner_support` → `record` → `clinic_confirmation`
4. `suggestedCardType` (LLM 제안)
5. `'general_action'` (fallback)

### 키워드 사전 (주요 항목)

```
injection:   주사, 고날에프, 퓨레곤, 메노푸어, 오비드렐, 데카펩틸, 루프론, 트리거, 난포터지는, 오가루트란, 세트로타이드
medication:  약, 복약, 복용, 정, 캡슐, mg, 질정, 프로게스테론, 에스트로겐, 루티너스, 듀파스톤, 아스피린
clinic_visit: 병원, 방문, 내원, 초음파, 채혈, 채취, 이식, 배양, 동결
clinic_confirmation: 확인, 물어, 문의, 헷갈림, 모르겠
partner_support: 남편, 파트너, 같이, 함께, 도와, 챙겨
record: 기록, 컨디션, 체온, 증상, 통증
```

`약` 단독 단어는 경계 검사(`\s약\s` 패턴)로 매칭.

---

## `computeDisplaySafetyLevel(card, now)`

```
card.status !== 'confirmed'      → 'normal'
card.user_marked_important       → 'critical'
card.card_type === 'injection' && scheduled_at:
  ±30분 이내                     → 'critical'
  오늘 날짜                       → 'time_sensitive'
card.confirmation_required       → 'time_sensitive'
otherwise                        → 'normal'
```

**규칙**: `DisplaySafetyLevel`은 UI 정렬·강조용이며 DB에 저장되지 않는다. LLM은 이 값을 설정할 수 없다.

---

## `computeReminderFallbackState(card, now)`

리마인더가 전송됐는데 카드가 15분 이상 지연된 경우 `'needs_recheck'` 상태 반환.

조건:
- `status === 'confirmed'`
- `user_marked_important === true`
- `scheduled_at` 존재
- `card_type`이 `injection` 또는 `medication`
- `scheduledAt < now - 15분`

`'needs_recheck'`이면 홈에서 `아직 확인 안 됐어요 · 조용히 다시 확인해 주세요.` 표시.

---

## 카드 상태 전이

```
confirmed → completed  (사용자 완료 처리)
confirmed → revoked    (원본 취소)
confirmed → superseded (새 카드로 대체, superseded_by 참조)
confirmed → dismissed  (사용자 무시)
* → archived           (보관)
```

파트너 화면에서 revoked/superseded 카드는 별도 뱃지로 표시.
