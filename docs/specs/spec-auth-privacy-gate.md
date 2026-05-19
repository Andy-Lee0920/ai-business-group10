# Spec: Auth, Couple Bootstrap, Privacy Gate

## 목적

Google OAuth 로그인 직후 couple shell을 생성하고, Privacy Gate 수락 전까지 민감정보 테이블 쓰기를 차단한다.

## 범위

- Google OAuth (Supabase Auth)
- Couple shell 자동 부트스트랩 (DB trigger + 서버 fallback)
- Privacy Gate 수락 상태 관리
- 민감정보 쓰기 경계 (`assertSensitiveWriteAllowed`)

---

## 구현 위치

| 파일 | 역할 |
|---|---|
| `src/domain/auth-privacy.ts` | 핵심 도메인 순수 함수 |
| `src/lib/couple-bootstrap-admin.ts` | 서버측 couple 부트스트랩 fallback |
| `src/lib/capture-confirm-store.ts` | Privacy Gate 검사 후 민감 쓰기 진입 |

---

## Couple Shell 구조

새 사용자 로그인 직후 자동으로 아래 4개 row가 생성된다.

```
couples (1 row)
  → couple_members: primary_user row (user_id = 로그인 사용자)
  → couple_members: partner placeholder row (user_id = null)
  → couple_states (1 row, privacy_gate_accepted_at = null)
```

### DB Trigger 우선 / 서버 Fallback 보조

1. `on_auth_user_created_init_couple` trigger가 auth.users INSERT 시 couple shell 전체를 생성한다.
2. Trigger가 실패하거나 ambiguity error가 발생하면 `bootstrapCoupleForUserWithServiceRole()` fallback이 idempotent하게 재생성한다.

---

## 도메인 타입

```ts
type CoupleState = {
  coupleId: string;
  privacyGateAcceptedAt: IsoTimestamp | null;
  privacyGateAcceptedBy: string | null;
  privacyGateVersion: string | null;
  firstCaptureCompletedAt: IsoTimestamp | null;
  waitingModeEnabled: boolean;
  updatedAt: IsoTimestamp;
};
```

---

## 핵심 함수

### `bootstrapCoupleShell(input)`

- `existing` shell이 이미 primary 멤버를 포함하면 그대로 반환 (idempotent).
- 없으면 userId 기반 stable ID로 couple + 2 members + state를 반환.

### `acceptPrivacyGate(state, { userId, now, version })`

- `privacyGateAcceptedAt`이 이미 설정되어 있으면 기존 상태 반환 (idempotent).
- 없으면 `privacyGateAcceptedAt`, `privacyGateAcceptedBy`, `privacyGateVersion`을 세팅.

### `canCreateSensitiveRow(state)`

```ts
return Boolean(state?.privacyGateAcceptedAt);
```

### `assertSensitiveWriteAllowed(state)`

- `canCreateSensitiveRow`가 false이면 throw.
- `capture-confirm-store.ts` Capture CTA 시점, 모든 민감 row 생성 전에 반드시 호출.

---

## Privacy Gate 버전

```ts
export const PRIVACY_GATE_VERSION = 'v1.0-slc';
```

버전은 `couple_states.privacy_gate_version` 컬럼에 기록된다.

---

## 쓰기 경계 규칙

Privacy Gate 수락 전에는 아래 테이블에 INSERT 불가:

- `visit_inputs`
- `action_split_drafts`
- `split_candidates`
- `care_action_cards`
- `partner_share_links`

위반 시 `assertSensitiveWriteAllowed`가 throw → API 403 응답.

---

## URL-action-result

- `/onboarding`에서 사용자가 동의를 완료하면 `couple_states.privacy_gate_accepted_at`이 세팅되고 홈으로 이동한다.
- 동의 전에 `/capture`를 직접 접근하면 403 또는 Privacy Gate로 리디렉트된다.

---

## 관련 결정

- `docs/04-decisions/0007-privacy-delete-boundary.md`
- `docs/01-product/prd-v1.0.md` §13
