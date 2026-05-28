# Codex — Slice 3 (#424) Push 발송 실패 처리

## Mission
Issue #424 acceptance 전건 Green + PR. 410/404 → subscription 무효화, 5xx → 실패 로그, 재구독 CTA, ADR 0028.

## 필독
- `slice-3-push-failure-issue.md`, `README.md` (같은 폴더)
- `gh issue view 424|421|422 --comments`
- `CLAUDE.md`, ADR `0004`(헤더)·`0006`, `docs/specs/spec-reminder-dispatch.md`
- 코드: `src/lib/web-push-reminder-pusher.ts`, `src/services/reminder-dispatch-service.ts`, `supabase/migrations/202605190002_*`, Slice 1 CTA

## Goal
`reminder_dispatches.failed_at + failure_reason='subscription_revoked'`가 있는 user가 `/(authed)/home` 방문 → CTA "알림 다시 받기" 노출, 클릭 시 새 `push_subscriptions` row(이전 revoked row 유지).

## Branch & PR
- `feat/424-push-failure`, title `feat(push): #424 failure + re-subscribe CTA`

## Steps (README 공통 반복: 3-strike STOP / Green 재편집 금지)
0. **Precondition**: #421+#422 머지 확인(`gh pr list --search "is:merged 421/422"` + main 반영). 미머지 → STOP+blocker-note.
1. **Schema migration**: `push_subscriptions.revoked_at timestamptz null`, `reminder_dispatches.failed_at timestamptz null`, `failure_reason text null`. RLS 무변경. comment에 의미(active=`revoked_at IS NULL`, failure_reason=`subscription_revoked`|`push_service_5xx_<code>`|`network_error_<code>`). `feat(schema): push failure tracking`
2. **web-push 에러 분기**: `web-push-reminder-pusher.ts`에서 `WebPushError.statusCode` 캐치 → 410|404: subscriptions.revoked_at set + dispatches.failed_at + reason='subscription_revoked'. 5xx: dispatches.failed_at + reason='push_service_5xx_<code>'(subscriptions 무변경). 그 외: reason='network_error_<code>'. 모든 분기 무재시도. unit 3 case(410/503/ECONNRESET). `feat(push): branch on web-push errors`
3. **SQL function revoked 제외**: `get_due_web_push_reminder_candidates` join에 `ps.revoked_at IS NULL` 추가. 통합 테스트(revoked만 있는 user candidate 미포함). `chore(schema): exclude revoked subs`
4. **CTA 라벨 분기**: Home server-side 활성 count(`user_id=$1 and revoked_at is null`). 0→"알림 다시 받기"+보조 메시지. 1+→숨김. unit+jsdom 두 상태. `feat(home): re-subscribe CTA branch`
5. **5xx 무재시도 통합 테스트**: T-60 503 후 T-15 진입 → send-due 정상 시도(재시도 없음). `test(integration): no retry after 5xx`
6. **e2e 재구독**: `tests/e2e/push-resubscribe-cta.spec.ts` — revoked seed → home → "알림 다시 받기" 노출 → 클릭 → 새 row + 이전 revoked 유지. `test(e2e): re-subscribe CTA`
7. **ADR 0028** `docs/04-decisions/0028-push-delivery-failure-policy.md` (Accepted 2026-05-28). 4 옵션(best-effort/in-app urgency/health check/log+invalidate+CTA) + Decision=마지막 + Prohibited(retry, 410에 user 정보). `docs(adr): 0028`
8. **DOD**: typecheck+test+e2e exit 0
9. **PR**: push, gh pr create, Issue #424 comment

## DOD
- migration 적용/deployment gap, web-push 3 case unit, revoked candidate 제외, CTA 분기+e2e, 5xx 무재시도 통합, ADR 0028, typecheck/test/e2e exit 0, PR + Issue #424 comment

## 금지
- retry queue 적재(정책: no retry), 410 로그에 user 정보, `Record<string, unknown>`/`any`로 web-push 우회, ADR 0006 `needs_recheck` 변경, README 공통(`@ts-ignore`/skip/amend/no-verify/close)

## STOP
- #421/#422 미머지 → blocker-note
- web-push statusCode 비구조 → 교체 child issue
- 구독 seed 부재 → 정비 child issue
