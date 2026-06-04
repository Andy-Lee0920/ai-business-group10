# AI/OCR 결과를 바로 일정으로 확정하지 않는 이유

> "확인-우선 원칙: AI 또는 앱이 생성한 콘텐츠는 사용자가 확인하기 전까지 draft 또는 inferred presentation이다."
> — PRD v1.0 §16.2

## 핵심 원칙: Confirmation-First

Fevio에서 care action은 기록만으로 확정되지 않는다. OCR 결과, LLM 분류, 파트너의 기록 — 어떤 경로로 생성되든 **사용자가 Confirm하기 전에는 실행 일정이 되지 않는다**.

이것이 Confirmation-First 원칙이다.

## 왜 OCR/AI 결과를 바로 확정하지 않는가

### 이유 1: 정확도와 안전성 검증 불가

OCR은 병원 지시문의 약 이름, 용량, 시간을 추출한다. 하지만:
- 약 이름이 비슷하면 OCR이 오인식한다
- 필기체나 약어는 오류율이 높다
- IVF에서 주사 타이밍 오류는 시술 취소로 이어질 수 있다

PRD는 명시적으로 `OCR 기반 처방전 자동 확정`을 **Out of Scope**로 결정했다. 이유: "정확도 및 안전성 검증 필요".

### 이유 2: 사용자가 원하는 것

사용자 인터뷰에서 검증된 고객 경험 #3:

> "**자동 정리는 원하지만 최종 확인권은 본인이 갖는 것**"

환자는 자동화 보조를 원하지만, 의료 행동의 최종 책임은 자신에게 있다는 것을 안다. 이 심리를 무시하고 자동 확정하면 신뢰를 잃는다.

### 이유 3: LLM 출력은 항상 draft

```ts
type LLMSplitCandidateDraft = {
  suggested_assigned_to?: AssignedTo | null;  // "suggested" — 제안만
  assigned_to: AssignedTo | null;              // null — 사용자가 채워야
};
```

LLM은 `suggested_*` 필드만 채울 수 있다. `assigned_to`는 null로 유지되고, 사용자가 분류 버튼을 눌러야 채워진다.

## 저장 타이밍: 두 단계 commit

```text
Commit 1 — Capture CTA:
  - visit_inputs (raw text 저장)
  - action_split_drafts (draft shell 생성)
  → split_candidates 저장 안 함
  → care_action_cards 생성 안 함

Client-only (DB 쓰기 없음):
  - line split 후보 목록
  - 분류 버튼 클릭 상태

Commit 2 — Confirm CTA:
  - split_candidates batch insert
  - care_action_cards 생성
  - couple_states.first_capture_completed_at 설정 (null인 경우만)
```

**분류 버튼 클릭은 DB에 쓰지 않는다.** 이것은 의도적 설계다. 사용자가 분류를 바꾸다가 실수로 중간 상태가 저장되면 안 된다.

## Confirm UI에서 원문 인라인 표시 규칙

약·주사 후보는 원문이 반드시 보여야 한다. (ADR 0029)

```ts
mustInlineQuote(candidate) =
  candidate.suggestedCardType in ('injection', 'medication')
  AND candidate.assignedTo === 'my_action'
```

파트너 행동, 병원 방문, 병원 확인, 기록, 일반 행동 후보는 mandatory quote 불필요. 이유: primary user가 직접 실행할 약/주사만 원문 추적이 필수적인 안전 요구사항이다.

## 확정된 Care Action Card의 지위

사용자가 Confirm한 후에도 `care_action_cards`는 의료 조언이 아니다. 그것은 **사용자가 조직한 병원 지시사항의 표현**이다.

```sql
medical_boundary_label TEXT NOT NULL DEFAULT 'user_confirmed_instruction'
```

이 필드는 "이것은 사용자가 확인한 지시사항이지 앱의 의료 판단이 아님"을 명시한다.

## 파트너 확인도 마찬가지

파트너가 주사를 놓아도 환자의 Confirm 없이는 확정되지 않는다.

```text
administered_by ≠ recorded_by ≠ confirmed_by_patient
```

- 파트너가 주사를 놓을 수 있다
- 파트너가 그 사실을 기록할 수 있다
- **환자가 confirm하기 전까지는 확정된 care action이 아니다**

## 안티패턴: 자동 저장

다음은 금지된 동작이다:

```
❌ 분류 버튼 클릭마다 DB autosave
❌ LLM 결과를 바로 CareActionCard로 생성
❌ 매 후보마다 강제 type selection
❌ OCR 추출 결과를 확인 없이 schedule에 저장
```

---

**관련 페이지:** [03-medical-boundary.md](03-medical-boundary.md) | [06-care-loop-architecture.md](06-care-loop-architecture.md) | [07-data-model.md](07-data-model.md)
