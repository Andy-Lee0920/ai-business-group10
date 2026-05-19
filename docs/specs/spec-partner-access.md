# Spec: Partner Access (파트너 뷰 & 공유 링크)

## 목적

파트너가 계정 없이 7일 share link로 오늘의 파트너 가시 카드를 읽기 전용으로 확인한다. 원본 메모, 민감 정보, DB 직접 접근은 완전히 차단한다.

## 범위

- 7일 couple-level 공유 링크 생성 / 취소
- 서버 토큰 검증 (raw token 미저장, hash만 저장)
- Partner View 서버 필터링 (라이브, 스냅샷 아님)
- 파트너 역할 projection (`translateCareCardToPartnerRole`)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/services/partner-share-link-service.ts` | 링크 목록 조회, 취소 |
| `src/lib/partner-share-link-repository.ts` | DB 접근 |
| `src/services/partner-view.ts` | 파트너 카드 서버 필터링 |
| `src/features/partner/partner-view.tsx` | Partner View UI |
| `src/domain/partner-role-projection.ts` | 카드 타입별 파트너 역할 안내 |
| `src/domain/partner-surface-signal.ts` | 파트너 화면 신호 계산 |

---

## 공유 링크 정책

```
TTL:  7일 (expires_at = created_at + '7 days')
단위: couple-level (카드 단위 아님)
수량: couple당 active link 1개
토큰: raw token 미저장, SHA-256 hash만 저장
```

링크 취소: `revokeLink(linkId, userId, repository)` — 소유자만 가능.

---

## `partner_share_links` 스키마 요약

```sql
id, couple_id, partner_member_id, created_by,
token_hash TEXT UNIQUE,    -- raw token 절대 저장하지 않음
status CHECK ('active' | 'expired' | 'revoked'),
expires_at TIMESTAMPTZ,
revoked_at TIMESTAMPTZ,
last_accessed_at, accessed_count
```

---

## Partner View 데이터 필터링 규칙

파트너에게 노출되는 정보:

- `title`
- `scheduled_at`
- `card_type` (action type)
- `display_state` — `current | new | changed_since_ack | revoked | superseded | completed`
- `partner_visible = true`인 카드만
- `status IN ('confirmed', 'completed', 'revoked', 'superseded')`

파트너에게 차단되는 정보:

- `raw_text` (원본 메모)
- `description` (원문 포함 가능)
- 사용자 private notes
- 감정 기록
- `partner_visible = false` 카드
- DB 직접 접근 (서버 token 검증 경유만 허용)

---

## 만료/취소 토큰 처리

- `expires_at < now` → expired 상태 페이지
- `revoked_at IS NOT NULL` → revoked 상태 페이지
- 유효하지 않은 token_hash → 404 또는 invalid 페이지

---

## 파트너 역할 Projection

`translateCareCardToPartnerRole(input)` — `CardType`별 파트너 안내 문구를 반환한다.

```ts
type PartnerRoleProjection = {
  partner_role: string;    // e.g. '확인자', '동행자'
  partner_action: string;  // 구체적 행동 안내
  avoid_prompt: string;    // 하지 말아야 할 것
  visibility: 'partner_safe' | 'private_summary';
};
```

| CardType | partner_role | visibility |
|---|---|---|
| injection | 확인자 | partner_safe |
| medication | 복약 확인자 | partner_safe |
| clinic_visit | 동행자 | partner_safe |
| clinic_confirmation | 정보 공동 수신자 | partner_safe |
| partner_support | 지원자 | partner_safe |
| record | 기록 동반자 | private_summary |
| general_action | 함께 확인하는 사람 | partner_safe |

`display_state === 'completed'`이면 partner_action에 완료 문구 추가.

---

## `PartnerActionViewItem` 타입

```ts
type PartnerActionViewItem = {
  card_id: string;
  title: string;
  scheduled_at: string | null;
  action_type: CardType;
  display_state: 'current' | 'new' | 'changed_since_ack' | 'revoked' | 'superseded' | 'completed';
  last_acknowledged_at?: string;
  current_revision: number;
  revision_seen?: number;
};
```

변경 감지: 파트너 확인 후 카드가 변경된 경우 `changed_since_ack` 뱃지 표시.

---

## URL-action-result

- `/partner/[token]`에서 파트너가 링크를 열면 서버가 token_hash로 검증 후 파트너 가시 카드만 반환한다.
- `/partner/[token]`에서 만료·취소 토큰이면 에러 상태 페이지를 본다.
- `/partner/[token]`에서 파트너는 `확인했어요` / `민지에게 물어볼게요` 버튼으로 acknowledgement를 남길 수 있다.

---

## 관련 결정

- `docs/01-product/prd-v1.0.md` §14
- `docs/04-decisions/0007-privacy-delete-boundary.md`
