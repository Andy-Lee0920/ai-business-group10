# Fevio가 의료 판단을 하지 않는 이유

> "Fevio does not provide: diagnosis, treatment recommendation, dosage adjustment, medication timing decision, embryo quality judgment, success prediction, symptom risk assessment."
> — PRD v1.0 §16.1

## 핵심 전제: Fevio는 의료기기가 아니다

IVF는 의료 도메인이다. 앱이 의료 판단(진단, 처방, 용량, 예후)을 하는 순간 두 가지 문제가 발생한다.

1. **규제 리스크**: 의료기기로 분류될 가능성 → 식약처 허가 없이 출시 불가
2. **신뢰 손상**: AI가 틀렸을 때 환자가 직접적 피해를 입는다. IVF에서 주사 타이밍 오류는 시술 취소로 이어질 수 있다.

이 두 리스크 때문에 Fevio는 **의료 판단을 절대 하지 않는다**. 이것은 기술적 한계가 아니라 의도적 설계 결정이다.

## 시스템이 생성할 수 있는 것 vs 없는 것

### 생성 가능
- 물류적 요약 (오늘 해야 할 것들)
- 사용자 행동 후보 (확인 전 draft)
- 파트너 행동 후보
- 병원 확인 prompts
- confirmed data로부터 UI component tree

### 절대 생성 불가
| 금지 문구 예시 | 이유 |
|---|---|
| "용량을 바꾸세요" | 의료 처방 변경 |
| "오늘 주사를 맞지 않아도 됩니다" | 의료 결정 |
| "이 증상은 정상입니다" | 의료 진단 |
| "성공 가능성이 높습니다" | 예후 예측 |
| "병원에 가지 않아도 됩니다" | 의료 조언 |

## AI/LLM에도 동일하게 적용

LLM이 활성화되어 있어도 다음은 금지된다:

- LLM이 `assigned_to` 결정 불가 → 사용자만 결정
- LLM이 `display_safety_level` 결정 불가 → deterministic 함수만
- LLM이 `care_action_cards` 직접 생성 불가 → 사용자 Confirm 후에만
- LLM output은 `suggested_*` 필드에만 → 항상 draft 상태

```ts
type LLMSplitCandidateDraft = {
  source_text: string;
  suggested_title?: string;
  suggested_assigned_to?: AssignedTo | null;  // suggested만
  suggested_card_type?: CardType | null;       // suggested만
  confidence: "high" | "needs_confirmation";
  uncertainty_reason?: string | null;
};
// assigned_to는 null → 사용자가 직접 분류
```

## display_safety_level은 의학적 판단이 아니다

`display_safety_level`은 UI 표시 우선순위다. 저장된 의학적 판단이 아니다.

```ts
function computeDisplaySafetyLevel(card, now): DisplaySafetyLevel {
  if (card.card_type === "injection" && card.scheduled_at) {
    const minutesUntil = diffMinutes(new Date(card.scheduled_at), now);
    if (minutesUntil <= 30 && minutesUntil >= -30) return "critical";
    if (isToday(new Date(card.scheduled_at), now)) return "time_sensitive";
  }
  return "normal";
}
```

이 함수는 pure computation이다. DB에 저장된 값이 아니라, 렌더링 시점에 계산된다.

## Medication Reference Image도 deterministic mapping

약 참조 이미지(`medication_reference_image`)는 확정된 약품 ID에서 deterministic하게 매핑된다. LLM이 추론하거나 AI가 생성하지 않는다. 매핑 대상 에셋이 없으면 이미지 없음 — 일반 실루엣 대체 금지. (ADR 0014)

## Daily Brief의 의료 fact 처리

Daily Brief는 admin-keyed LLM이 생성하지만, 의료 fact는 **deterministic guardrail dict**에서만 주입된다.

```
factDict[phase] → LLM system prompt에 주입
LLM 출력 → keyword filter로 금지 패턴 검사
위반 시 → reject + deterministic dict raw text fallback
```

LLM이 factDict 밖 의료 fact를 출력하면 자동 reject된다. (ADR 0021)

## Clinic Guide AI 경계

`Clinic Guide AI`는 사용자가 입력한 내용을 기존 제품 데이터와 매핑하는 보조 도구다.

| 허용 | 금지 |
|---|---|
| 약품명 문자열 → medications 테이블 행 정규화 | 약 용량 추론 또는 확정 |
| 다음 인터뷰 질문 제안 | 투약 시간 자동 결정 |
| 사용자 입력 보조 (자동완성 힌트) | 치료 단계 판단 |
| | "이 약을 맞아야 합니다" 류 의학적 조언 |
| | 일정 자동 저장 (사용자 확인 없이) |

**정책**: `requiresUserConfirmation: true`는 AI 생성 draft에 의무적이다.

## 왜 "확인권은 본인"이 핵심 UX인가

사용자 인터뷰에서 검증된 핵심 고객 경험 #3:

> "**자동 정리는 원하지만 최종 확인권은 본인이 갖는 것**"

환자는 앱이 도와주는 것을 원하지만, 의료 행동의 최종 책임은 자신에게 있다는 것을 안다. Confirmation-first 설계는 이 심리를 반영한다.

---

**관련 페이지:** [04-confirmation-first.md](04-confirmation-first.md) | [08-ai-llm-policy.md](08-ai-llm-policy.md) | [01-true-problem.md](01-true-problem.md)
