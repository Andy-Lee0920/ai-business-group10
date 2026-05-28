## Parent

신규 (ADR 0028 정착 슬라이스). 관련: #421, #422

## What to build

Web Push 발송 실패 처리 + subscription 무효화 + 재구독 CTA 슬라이스. cron → send-due → web-push library → 브라우저 push service → 사용자 기기 경로에서 발생하는 silent failure를 가시화하고 자가복구 경로를 만든다.

기존 코드 사실:
- ADR 0006(reminder-fallback-policy)은 in-app `needs_recheck` 상태만 다룸 — 외부 push 자체 실패는 미정
- `src/lib/web-push-reminder-pusher.ts`가 web-push 호출 담당
- `public.push_subscriptions` 테이블 존재 (RLS, user_id = auth.uid())
- `public.reminder_dispatches` 테이블 존재 (channel enum 포함)
- #421의 inline CTA 컴포넌트가 본 슬라이스의 "재구독" UX 재사용 대상

이 슬라이스에서:

1. **410/404 무효화**: web-push 응답이 `410 Gone` 또는 `404 Not Registered`이면 해당 `push_subscriptions` row의 `revoked_at timestamptz` 칼럼을 set
2. **5xx 실패 로그**: `reminder_dispatches`에 `failed_at timestamptz`, `failure_reason text` 칼럼 추가. 5xx 응답은 row 작성 + 재시도 없음 (다음 윈도우만 시도)
3. **재구독 CTA 분기**: #421의 inline CTA가 사용자의 활성 구독이 없으면 (모든 row가 `revoked_at not null`) "알림 다시 받기" 라벨로 노출
4. **ADR 0028 작성**: 4개 옵션 비교 + 결정 근거

## Acceptance criteria

- [ ] supabase/migrations 신규 파일:
  - `push_subscriptions`에 `revoked_at timestamptz null` 추가
  - `reminder_dispatches`에 `failed_at timestamptz null`, `failure_reason text null` 추가
- [ ] `src/lib/web-push-reminder-pusher.ts` 또는 호출자에서 web-push 에러 분기:
  - 410/404 → push_subscriptions.revoked_at 갱신 + reminder_dispatches.failed_at + failure_reason='subscription_revoked'
  - 5xx → reminder_dispatches.failed_at + failure_reason='push_service_5xx_<code>' (재시도 없음)
  - 그 외 네트워크 오류 → reminder_dispatches.failed_at + failure_reason='network_error_<code>'
- [ ] SQL function `get_due_web_push_reminder_candidates`가 `revoked_at not null` 구독을 제외하도록 갱신 (또는 호출자에서 필터)
- [ ] #421의 inline CTA가 사용자 활성 구독 부재 시 "알림 다시 받기" 라벨로 노출 (서버 props로 활성 구독 유무 전달)
- [ ] ADR 0028 (`docs/04-decisions/0028-push-delivery-failure-policy.md`) 작성: 4개 옵션 비교 + 결정 + 근거
- [ ] `npm run typecheck` 통과
- [ ] `npm test` 통과
- [ ] 단위 테스트: web-push가 410 mock 반환 시 `push_subscriptions.revoked_at` set + `reminder_dispatches.failed_at + failure_reason='subscription_revoked'` 기록
- [ ] 단위 테스트: web-push가 503 mock 반환 시 `reminder_dispatches.failed_at + failure_reason='push_service_5xx_503'` 기록 + push_subscriptions 변경 없음
- [ ] 단위 테스트: 5xx 실패 후 다음 윈도우는 정상 시도 (재시도 없음 검증)
- [ ] e2e 테스트: 모든 구독이 revoked인 사용자가 `/(authed)/home` 방문 시 inline CTA가 "알림 다시 받기" 라벨로 노출

## URL-action-result

`reminder_dispatches.failed_at + failure_reason='subscription_revoked'` row가 있는 사용자가 `/(authed)/home`에 방문했을 때 inline CTA가 "알림 다시 받기" 라벨로 노출되고, 클릭 시 새 `push_subscriptions` row가 생성된다 (이전 row의 `revoked_at`은 그대로 유지).

## Anti-patterns (reject)

- 실패한 dispatch를 retry queue에 적재 (정책: no retry)
- 410 응답에 user-identifiable 정보 로그
- `Record<string, unknown>` 또는 `any`로 web-push 에러 타입 우회
- ADR 0006의 `needs_recheck` 로직을 변경 (별개 책임)

## STOP conditions

- #421이 Red 상태(머지 안 됨 또는 CTA 컴포넌트 시그니처 미정)이면 stop
- #422가 Red 상태이면 stop (`reminder_dispatches` UNIQUE 제약 없이 작업하면 race 보강이 의미 없음)
- web-push 라이브러리 버전이 410/404 에러 타입을 구조화하여 노출하지 않으면 stop하고 라이브러리 교체 child issue 분리

## Blocked by

- #421 (Slice 1 — inline CTA 컴포넌트 패턴 재사용)
- #422 (Slice 2 — reminder_dispatches UNIQUE 제약 선결)
