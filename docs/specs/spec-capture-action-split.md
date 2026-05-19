# Spec: Capture & Action Split

## 목적

사용자가 병원 안내문을 자유 형식으로 붙여넣거나 입력하면, 줄 단위로 분리된 후보를 역할별로 분류하고, Confirm 시점에 한 번에 `care_action_cards`로 확정한다.

## 범위

- 자연어 입력 캡처 (`visit_inputs`)
- 결정론적 줄 분리 (`splitLines`)
- 프로토콜 draft 생성 (`createProtocolDraft`)
- 4-버튼 역할 분류 (`AssignedTo`)
- Confirm 트랜잭션 (`confirm_capture` RPC)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/line-split.ts` | `splitLines`, `inferCardType` re-export |
| `src/domain/protocol-draft.ts` | `createProtocolDraft` — 줄 분리 + 타입 추론 + 시간 추출 |
| `src/lib/capture-confirm-store.ts` | `CaptureStore` — DB 쓰기 경계 + Confirm RPC |

---

## 커밋 포인트 2개

```
Capture CTA 클릭
  → visit_inputs INSERT (raw_text 저장)
  → action_split_drafts INSERT (shell만)
  → 클라이언트 상태: 줄 분리 candidates (DB 미저장)

분류 버튼 클릭
  → 클라이언트 상태 변경만 (DB 쓰기 없음)

Confirm CTA 클릭
  → confirm_capture RPC 호출
      → split_candidates batch INSERT
      → care_action_cards batch INSERT (excluded 제외)
      → couple_states.first_capture_completed_at 최초 1회 세팅
```

---

## `splitLines(input)` 규칙

1. `\r?\n` 줄바꿈 기준 1차 분리
2. 마침표·물음표·느낌표(`[.!?。！？]`) 뒤 공백 기준 2차 분리
3. 불릿 마커(`-`, `*`, `•`, 숫자, 한글) 제거
4. MIN_FRAGMENT_LENGTH(3자) 미만 조각은 이전 문장에 병합
5. 공백 정규화 후 중복 제거

---

## `createProtocolDraft(rawInstruction, baseDate)` 추가 처리

`splitLines` 이후 각 줄에 대해:

- `inferCardType(sourceText, 'my_action')` — 카드 타입 추론
- `extractScheduledAt(sourceText, baseDate)` — 시간 추출 (`오전/오후/밤`, `시`, 숫자 패턴)
- `extractCareDate(sourceText, baseDate)` — 날짜 추출 (`오늘/내일/모레`, `M/D` 패턴)
- `uncertaintyReason` — 타입이 `general_action`이거나, 주사·약·방문인데 시간/약명이 없는 경우 경고 문구 생성

반환: `ProtocolDraftItem[]`

---

## 역할 분류 (`AssignedTo`)

```ts
type AssignedTo =
  | 'my_action'         // 내 할 일
  | 'partner_action'    // 파트너에게 공유
  | 'clinic_confirmation' // 병원에 확인
  | 'excluded';         // 제외
```

분류 버튼 클릭은 클라이언트 상태만 변경. Confirm 전까지 DB 미저장.

---

## Confirm RPC 입력 (`ConfirmItem`)

```ts
type ConfirmItem = {
  sourceText: string;
  assignedTo: AssignedTo;
  orderIndex: number;
  userSelectedCardType?: CardType | null;
  suggestedCardType?: CardType | null;
  scheduledAt?: string | null;
  careDate?: string | null;
  description?: string | null;
  userMarkedImportant?: boolean;
  partnerVisible?: boolean;
};
```

- `assignedTo === 'excluded'`이면 `care_action_cards` 미생성.
- `card_type`은 RPC 직전 서버에서 `inferCardType` 재계산.

---

## Description Content 규칙

`care_action_cards.description`에 금지된 표현 (확인 경고 대상, 차단 아님):

- 용량 조정: `용량을 올리세요`, `두 배로 늘려`
- 진단·병명 추론: `PCOS 증상이 의심`
- 성공률 단정: `성공 가능성이 높아요`
- 치료 전략 변경: `이식 취소`, `처방을 대체하세요`

자세한 규칙 → `docs/specs/description-content-rules.md`

---

## URL-action-result

- `/capture`에서 Capture CTA를 누르면 `visit_inputs`와 `action_split_drafts`만 생성된다.
- `/capture/review`에서 Confirm을 누르면 `care_action_cards`가 생성되고 홈 care day가 전환된다.
- Privacy Gate 미수락 상태에서 Capture CTA → 403.
