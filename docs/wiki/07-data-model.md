# 핵심 데이터 모델 계약

> 이 페이지는 ADR과 PRD에서 확립된 데이터 모델의 핵심 계약을 정리한다. 스키마 세부는 `docs/03-engineering/schema-rls-matrix.md` 참고.

## 테이블 계보: 어떻게 연결되는가

```text
auth.users
  └─ couples (1:1, trigger on INSERT)
       ├─ couple_members (primary_user row + partner placeholder row)
       ├─ couple_states (care day, capture 완료 여부 등)
       ├─ visit_inputs (raw clinic memo)
       │    └─ action_split_drafts
       │         └─ split_candidates (Confirm시에만 생성)
       │              └─ care_action_cards (Confirm 후 생성)
       └─ partner_share_links (7일 TTL, hash만 저장)
            └─ partner_share_events (viewed / acknowledged / needs_clarification)
```

## 핵심 테이블별 불변 규칙

### `care_action_cards` — 유일한 canonical confirmed table (ADR 0013)

```sql
status: 'confirmed' | 'completed' | 'dismissed' | 'revoked' | 'superseded' | 'archived'
medical_boundary_label: DEFAULT 'user_confirmed_instruction'
partner_visible: DEFAULT false
confirmation_required: DEFAULT true
```

**불변 규칙:**
- 홈 화면 executable surface는 `status = 'confirmed'` 카드만 렌더링
- LLM이 직접 생성 불가; 오직 사용자 Confirm 후에만 생성
- `schedule_items`는 legacy — 새 기능의 write target이 되면 안 됨

### `split_candidates` — 확정 전 분류 단계

```sql
assigned_to: NOT NULL (Confirm 시점에 채워짐)
suggested_assigned_to: NULLABLE (LLM 제안)
confidence: 'high' | 'needs_confirmation'
```

**불변 규칙:**
- Confirm CTA 전까지 행이 존재하지 않음
- LLM의 suggested 값은 참고용; 사용자 assigned_to가 canonical

### `couple_states` — 케어 컨텍스트 상태

```sql
first_capture_completed_at: TIMESTAMPTZ  -- null이면 onboarding
manually_selected_care_day: TEXT         -- 대기 모드 수동 진입용
waiting_mode_dismissed_until: TIMESTAMPTZ
```

`first_capture_completed_at`이 null인지 여부가 `onboarding` vs 나머지를 결정한다. 한 번만 set된다.

### `partner_share_links` — 토큰 보안

```sql
token_hash: TEXT UNIQUE  -- SHA-256(raw_token)만 저장
expires_at: created_at + 7 days
status: 'active' | 'expired' | 'revoked'
```

**절대 규칙:** raw token은 어떤 테이블에도, 어떤 로그에도 저장하지 않는다.

## 두 개의 저장 단계 (Commit Points)

### Commit 1: Capture CTA

```
생성: visit_inputs, action_split_drafts
미생성: split_candidates, care_action_cards
```

### Commit 2: Confirm CTA (atomic transaction)

```
생성: split_candidates (batch)
생성: care_action_cards (excluded 항목 제외)
업데이트: couple_states.first_capture_completed_at (null인 경우만)
```

이 transaction이 atomic해야 한다. 중간에 실패하면 rollback.

## care_action_cards vs schedule_items

현재 코드베이스에 두 개의 테이블이 존재한다. ADR 0013이 canonical을 결정했다.

| 속성 | care_action_cards | schedule_items |
|---|---|---|
| 상태 | **canonical** | legacy |
| Partner View | ✅ 읽음 | ❌ 읽지 않음 |
| Web Push reminder | ✅ 읽음 | ❌ 읽지 않음 |
| 새 기능 write | ✅ 여기에 써야 함 | ❌ 금지 |
| 언제 폐기 | — | migration 완료 후 |

`schedule_candidates`, `schedule_items`에 새 feature를 연결하면 ADR 0013 위반.

## CycleEvent — 상태 머신 방식 phase 추적

IVF cycle의 phase를 date timer로 추적하지 않는다. 대신 append-only event stream + pure reducer를 사용한다. (ADR 0011)

```ts
type CyclePhaseState = {
  predictedPhase: IvfPhase | null;  // 예측만, surface 사용 금지
  suggestedPhase: IvfPhase | null;  // 미확인, surface 사용 금지
  confirmedPhase: IvfPhase;         // 오직 이것만 surface에서 사용
  confidence: 'low' | 'medium' | 'high';
};
```

**표면 규칙:** home, partner, notification은 오직 `confirmedPhase`만 읽는다.

## RLS 핵심 경계

```
authenticated user → 자신의 couple data만
anon user → care_action_cards 직접 쿼리 불가
partner token → server-controlled projection만
service_role → server/Edge paths에서만
```

## PartnerActionViewItem — 파트너에게 노출되는 타입

```ts
type PartnerActionViewItem = {
  card_id: string;
  title: string;
  scheduled_at: string | null;
  action_type: CardType;
  display_state: "current" | "new" | "changed_since_ack" | "revoked" | "superseded" | "completed";
  last_acknowledged_at?: string;
  current_revision: number;
  revision_seen?: number;
};
```

이 타입에 없는 것: raw_text, source_text, description (전체), 환자 메모, 치료 히스토리.

---

**관련 페이지:** [06-care-loop-architecture.md](06-care-loop-architecture.md) | [04-confirmation-first.md](04-confirmation-first.md) | [05-partner-projection.md](05-partner-projection.md)
