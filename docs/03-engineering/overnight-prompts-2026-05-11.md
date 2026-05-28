# Overnight Codex Prompts — 2026-05-11

이 문서는 단일 회차 overnight 배치를 위한 Codex 프롬프트 4개를 담는다. 각 프롬프트는 자율 실행 가능하도록 설계됨.

## 실행 계약

- 베이스 브랜치: `main`
- 의존: STEP 0 → (STEP 1, STEP 2, STEP 3 병렬 가능)
- 머지 정책: 각 STEP은 독립 PR 생성. STEP 0 머지 후 나머지 STEP의 베이스 rebase.
- 스코프 위반: 명시된 파일 외 수정 금지. 의심 시 PR 코멘트로 보고하고 다음 STEP으로 이동.
- 실패 처리: typecheck/test/build red면 root cause 수정 후 재실행. 우회·skip 금지.
- 보고 형식은 `docs/03-engineering/overnight-batch-runbook.md` §"Report format" 사용.
- TDD 정책: `docs/03-engineering/tdd-policy.md` PR 머지 거부 기준 7개 모두 통과.

## 환경 사전 점검 (STEP 시작 전 공통)

```bash
git checkout main
git pull origin main
npm ci
npm run typecheck
npm run test
npm run build
```

세 명령 모두 green일 때만 STEP 진행. red면 progressing하지 않고 보고.

---

## STEP 0 — #68 Visual Productization (working tree finalize)

### 컨텍스트

루트 working tree에 #68 구현이 staged되지 않은 상태로 존재한다. 7개 변경 파일:

- `middleware.ts` (NEW) — Supabase SSR 세션 기반 라우트 보호 + 환경변수 부재 시 graceful pass-through
- `app/layout.tsx` (MOD) — Noto Sans KR + theme-color/viewport meta
- `app/page.tsx` (MOD) — "SLC scaffold" 제거, 단일 CTA 랜딩
- `app/(authed)/layout.tsx` (NEW) — BottomTabBar (오늘/기록/파트너)
- `app/(authed)/home/loading.tsx` (NEW) — Suspense 스켈레톤
- `app/not-found.tsx` (NEW) — 404 페이지
- `app/error.tsx` (NEW) — 에러 경계 (`'use client'`)
- `tests/e2e/app-shell.spec.ts` (MOD) — 새 카피 + middleware redirect + 404 검증

### 목표

이 working tree 변경을 검증·커밋·PR한다. 추가 코드 작성 금지 — 검증과 PR화만.

### 브랜치

```
codex/issue-68-app-shell
```

(이미 존재할 수 있음 — `git switch -c codex/issue-68-app-shell || git switch codex/issue-68-app-shell`)

### 실행 단계

1. `git status`로 7개 변경 확인
2. `npm run typecheck` green
3. `npm run test` green (57+ tests)
4. `npm run build` green (middleware route 표시 확인)
5. `npm run test:e2e` (있을 시) — 새 e2e 3개 + 기존 e2e 모두 green
6. `git add` 변경 파일 8개
7. `git commit` — 메시지: `feat(shell): root landing, middleware, font, error states (#68)`
8. `git push -u origin codex/issue-68-app-shell`
9. `gh pr create` — title: `[P1] 앱 Shell 시각화 — 루트 페이지·폰트·네비·빈 상태 (#68)`. body는 #68 issue 본문 요약 + 변경 파일 목록 + 검증 결과.

### 금지

- `src/domain/`, `src/services/`, `app/api/` 변경
- `home/page.tsx`의 `computeHomeContext`, `makeDemoCards` 변경
- 새 의존성 추가
- "더 좋은" 리팩터링 (working tree 변경 외)

### Acceptance

- [ ] 8 files committed
- [ ] PR 생성 완료
- [ ] CI green (Fevio CI)
- [ ] e2e 3개 신규 + 기존 모두 pass

---

## STEP 1 — #54 Description Content Guide (TDD)

### 브랜치

```
codex/issue-54-description-guide
```

베이스: `main` (STEP 0 머지 후 rebase)

### 사전 읽기 (필수)

- `docs/01-product/original-note-hyunjoo.md` §5-3, §6-1
- `docs/01-product/prd-v1.0.md` §16
- `docs/04-decisions/0002-p0-boost-rules.md` 룰 #27-A
- `docs/03-engineering/tdd-policy.md`

### 목표

`care_action_cards.description` 필드의 콘텐츠 규약을 정하고, confirm 화면에서 금지 표현을 사용자에게 경고(차단 아님)한다.

### 파일 변경

1. `docs/specs/description-content-rules.md` (NEW)
   - 허용 카테고리: 행동(투여/복용/방문), 시간(시각/주기), 종류(약/주사명), 횟수
   - 금지 카테고리: 용량 조정 표현, 진단/병명 추론, 성공률 단정, 치료 전략 변경, "X mg로 올려/내려" 류
   - 각 카테고리당 5+ 패턴 예시
2. `src/utils/description-guard.ts` (NEW) — pure function, no I/O
   - `detectForbiddenPhrases(text: string): ForbiddenPhraseHit[]`
   - `validateDescription(text: string): { ok: boolean; warnings: ForbiddenPhraseHit[] }`
   - `ForbiddenPhraseHit` 타입: `{ phrase: string; category: 'dosage_change' | 'diagnosis' | 'success_rate' | 'treatment_strategy'; matched: string; offset: number }`
   - 패턴은 정규식 + 명시적 키워드 카탈로그 (한글 변형 포함)
3. `src/types/description-guard.types.ts` (NEW)
4. `tests/unit/description-guard.test.ts` (NEW) — TDD-policy 7개 기준 모두 충족
5. `app/split-review/page.tsx` (또는 description 입력 UI 위치) — 입력 onChange/onBlur에서 warning 노출 (차단 아님). 빨간 배지 + 아이콘 + 설명. 사용자가 "그래도 저장"으로 진행 가능.
6. `tests/e2e/description-guard.spec.ts` (NEW) — confirm 화면 입력 후 경고 표시 + 사용자가 무시 가능 + partner view에 텍스트 그대로 노출

### TDD RED 시나리오 (먼저 작성)

```typescript
it('"고날에프 1회, 21시"는 위반 없음', () => {
  expect(validateDescription('고날에프 1회, 21시').ok).toBe(true);
});

it('"용량을 올리세요"는 dosage_change로 검출', () => {
  const hits = detectForbiddenPhrases('용량을 올리세요');
  expect(hits[0].category).toBe('dosage_change');
});

it('진단/병명 추론 표현 검출', () => {
  expect(detectForbiddenPhrases('PCOS 증상이 의심되니')[0].category).toBe('diagnosis');
});

it('순수 함수 — 동일 입력 동일 출력', () => {
  const a = detectForbiddenPhrases('용량 증량');
  const b = detectForbiddenPhrases('용량 증량');
  expect(a).toEqual(b);
});

it('null/undefined/empty 안전 처리', () => {
  expect(validateDescription('').ok).toBe(true);
  expect(detectForbiddenPhrases('')).toEqual([]);
});

it('expectTypeOf — return shape', () => {
  expectTypeOf(validateDescription).returns.toMatchTypeOf<{ ok: boolean; warnings: ForbiddenPhraseHit[] }>();
});
```

### 완료 기준

- [ ] 콘텐츠 규약 문서 머지
- [ ] `description-guard.ts` 단위 테스트 12개 이상
- [ ] confirm 화면 hint + warning 노출
- [ ] e2e: 사용자 confirm description이 partner view에 그대로 노출
- [ ] PR 생성, CI green

### 금지

- LLM 호출 추가
- description 입력 차단 (warning만)
- 의료 검수 워크플로
- `care_action_cards` 스키마 수정

---

## STEP 2 — #61 Partner Share Link Revoke UI (TDD)

### 브랜치

```
codex/issue-61-partner-revoke
```

베이스: `main` (STEP 0 머지 후 rebase)

### 사전 읽기 (필수)

- `docs/01-product/prd-v1.0.md` §14
- `docs/04-decisions/0002-p0-boost-rules.md` 룰 #27-A
- `supabase/migrations/202605100004_partner_share_links.sql` (이미 적용됨)
- `src/services/partner-view.ts` 또는 동등 — 토큰 hash 검증 로직
- `docs/03-engineering/tdd-policy.md`

### 목표

사용자가 자신이 만든 partner share link 목록을 보고 한 번에 회수(revoke)할 수 있는 UI + 서버 endpoint.

### 파일 변경

1. `app/api/partner-share-links/[id]/revoke/route.ts` (NEW)
   - `POST` only
   - 인증 + 본인 소유 link만 회수 가능 (RLS + server-side `auth.uid()` 비교)
   - DB: `partner_share_links` 테이블에 `revoked_at` 설정 (마이그레이션 이미 컬럼 존재 가정 — 없으면 마이그레이션 추가)
   - 응답: `{ revoked_at: string }` 또는 `{ error: string }`
2. `src/services/partner-share-link-service.ts` (NEW or EXTEND)
   - `listActiveLinksForUser(userId): PartnerShareLinkSummary[]`
   - `revokeLink(linkId, userId): { revoked_at }`
3. `src/types/partner-share-link.types.ts` (EXTEND or NEW)
   - `PartnerShareLinkSummary = { id, createdAt, expiresAt, lastAccessedAt | null, revokedAt | null }`
4. `app/(authed)/settings/sharing/page.tsx` (NEW)
   - 활성 링크 목록 (만든 시각, 만료 예정, 마지막 접근 시각, 회수 버튼)
   - 회수 confirm 모달 — "이 링크는 즉시 무효화됩니다. 계속할까요?"
   - 회수 후 목록에서 사라지거나 "회수됨" 배지로 변경
   - BottomTabBar의 "파트너" 탭이 이 페이지로 가도록 (또는 별도 진입 — 결정해서 PR 본문에 명시)
5. `tests/unit/partner-share-link-service.test.ts` (NEW)
6. `tests/e2e/partner-revoke.spec.ts` (NEW)
   - 사용자 로그인 → 링크 생성 → revoke → partner view fetch가 revoked 상태 반환

### TDD RED 시나리오

```typescript
it('revokeLink — 본인 소유 링크는 revoked_at을 설정한다', async () => {
  const result = await revokeLink('link-1', 'user-1');
  expect(result.revoked_at).toBeTruthy();
});

it('revokeLink — 다른 사용자 소유 링크는 throw', async () => {
  await expect(revokeLink('link-1', 'user-2')).rejects.toThrow('권한이 없습니다');
});

it('listActiveLinksForUser — revoked link는 제외', async () => {
  const links = await listActiveLinksForUser('user-1');
  expect(links.every((l) => l.revokedAt === null)).toBe(true);
});

it('expectTypeOf — PartnerShareLinkSummary shape', () => {
  expectTypeOf<PartnerShareLinkSummary>().toMatchTypeOf<{ id: string; revokedAt: string | null }>();
});
```

### 완료 기준

- [ ] revoke endpoint + RLS 단위 테스트
- [ ] sharing 페이지 활성 링크 목록 노출
- [ ] confirm 모달
- [ ] e2e: 회수 후 partner view가 revoked 상태 반환
- [ ] partner view (서버 응답)에서 raw token, 의료 텍스트, raw user 정보 노출 없음 확인 단위 테스트
- [ ] PR 생성, CI green

### 금지

- 자동 만료 정책 변경
- 신규 link 생성 UI 변경 (별도 이슈)
- partner_share_links 스키마 변경 (이미 마이그레이션됨)

---

## STEP 3 — #69 Presentation Demo Polish (TDD)

### 브랜치

```
codex/issue-69-presentation-polish
```

베이스: `main` (STEP 0 머지 후 rebase)

### 사전 읽기 (필수)

- `docs/03-engineering/deployment-readiness.md` §"Presentation lane contract"
- `docs/03-engineering/overnight-batch-runbook.md` §"Deployment lanes"
- `src/lib/capture-confirm-store.ts` (DemoCaptureStore 패턴)
- `src/config/index.ts` (`isPresentationMode` flag)
- `src/types/care-cards.types.ts` (CareActionCard shape — 변경 금지)
- `app/(authed)/home/page.tsx` (현재 demo cards 패턴)

### 목표

`NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1`로 빌드된 발표 레인이 백엔드 없이도 IVF 부부의 완결된 사용 시나리오를 보여주도록 한다.

### 파일 변경

1. `src/lib/presentation-demo-data.ts` (NEW) — pure function module
   - `getPresentationCards(now: Date): CareActionCard[]` — 5+ 카드, deterministic
   - `getPresentationClinicMemo(): string` — 샘플 메모 텍스트
   - `getPresentationPartnerView(): PartnerActionViewItem[]` — sanitized partner 뷰 (이미 partner-view 모듈 존재 시 동일 shape 사용)
   - 카드 분포: critical 2 + routine 2 + completed 1
   - 한국어 IVF 시나리오 (실제 약물명: 고날에프, 프로게스테론, 오비트렐 등)
2. `src/types/presentation-demo.types.ts` (NEW or 기존 reuse)
3. `app/(authed)/home/page.tsx` (MOD)
   - 서버 컴포넌트 안에서 `isPresentationMode()` 분기
   - true → `getPresentationCards(new Date())` 결과 렌더
   - false → 기존 Supabase 조회 유지
4. `app/capture/page.tsx` (MOD)
   - presentation mode일 때 textarea의 `defaultValue`로 sample 메모 pre-fill
   - "데모 리셋" 버튼 (선택, 추가 시 보고)
5. `app/partner/[token]/page.tsx` (MOD)
   - `params.token === 'demo'`이면 `getPresentationPartnerView()` 결과 렌더, partner_share_links DB 조회 skip
6. `tests/unit/presentation-demo-data.test.ts` (NEW)
7. `tests/e2e/presentation-mode.spec.ts` (NEW)

### TDD RED 시나리오

```typescript
it('5개 이상 카드 반환', () => {
  expect(getPresentationCards(new Date()).length).toBeGreaterThanOrEqual(5);
});

it('critical 카드 1개 이상 — 발표용 임팩트', () => {
  const cards = getPresentationCards(new Date('2026-05-11T20:00:00.000Z'));
  expect(cards.some((c) => c.displaySafetyLevel === 'critical')).toBe(true);
});

it('동일 now에 대해 deterministic — ID·시각 동일', () => {
  const now = new Date('2026-05-11T20:00:00.000Z');
  const a = getPresentationCards(now);
  const b = getPresentationCards(now);
  expect(a).toEqual(b);
});

it('immutable — 반환 배열 mutation은 다음 호출에 영향 없음', () => {
  const a = getPresentationCards(new Date());
  a.pop();
  const b = getPresentationCards(new Date());
  expect(b.length).toBeGreaterThanOrEqual(5);
});

it('expectTypeOf — return shape', () => {
  expectTypeOf(getPresentationCards).returns.toMatchTypeOf<CareActionCard[]>();
});

it('partner view sanitization — 의료 메모/raw token 미포함', () => {
  const items = getPresentationPartnerView();
  for (const item of items) {
    expect(item).not.toHaveProperty('raw_text');
    expect(item).not.toHaveProperty('token');
    expect(item).not.toHaveProperty('user_id');
  }
});
```

### Playwright e2e (presentation 모드)

```typescript
// tests/e2e/presentation-mode.spec.ts
// playwright.config.ts에 presentation project 추가하거나 webServer env로 NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1 주입
test('presentation home renders 5+ demo cards', async ({ page }) => {
  await page.goto('/home');
  const cards = page.getByTestId('home-action-card');
  await expect(cards).toHaveCount({ min: 5 } as never); // 또는 await expect(cards.count()).resolves.toBeGreaterThanOrEqual(5);
});

test('presentation /partner/demo renders sanitized view', async ({ page }) => {
  await page.goto('/partner/demo');
  await expect(page.getByText(/raw_text/)).not.toBeVisible(); // 노출되면 안 됨
});
```

### 완료 기준

- [ ] presentation mode `/home`에 카드 5개 이상
- [ ] `/capture` sample 메모 pre-fill
- [ ] `/partner/demo` sanitized view
- [ ] Real SLC mode (env flag 없음) 동작 무영향 — 기존 unit/e2e 모두 green
- [ ] PR 생성, CI green

### 금지

- LLM 호출
- `CareActionCard` 타입 변경 (`src/types/care-cards.types.ts` immutable)
- 새 라우트 추가 — 분기만
- `display_safety_level`을 persisted 필드로 만들기

---

## 머지 순서 권장

```
1. STEP 0 PR 머지 (#68 shell — UI 변경의 기반)
   ↓ rebase
2. STEP 3 PR 머지 (#69 presentation polish — 발표 데모용 우선 가시화)
   ↓ rebase
3. STEP 1 PR 머지 (#54 description guide — partner 콘텐츠 안전판)
   ↓ rebase
4. STEP 2 PR 머지 (#61 partner revoke — 신뢰성 보강)
```

각 머지 후 `https://project-oznp0.vercel.app` 자동 재배포 확인. 발표 레인은 STEP 3 PR 머지 후 Andy-owned Vercel에서 `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1` 빌드 트리거.

---

## 보고 형식 (각 STEP 종료 시)

```text
STEP N — #issue [done/blocker]
PR: <url>
Lane validated: real SLC / presentation / both
Tests: <pass count> / <total>
npm run typecheck: ✅/❌
npm run test: ✅/❌
npm run build: ✅/❌
npm run test:e2e: ✅/❌/skipped
Files changed: <count>
Remaining Red: none / <details>
Secrets touched: no raw values printed / rotation required
Scope-risk: narrow / medium / wide
Confidence: high / medium / low
```
