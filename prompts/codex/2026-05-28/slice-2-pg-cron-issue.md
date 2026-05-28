## Parent

#380 (ref #379)

## What to build

Supabase pg_cron 매분 스케줄러 + `reminder_dispatches` UNIQUE 제약 명시화 슬라이스. T-60/T-15 injection reminder의 시간 정확성과 중복 발송 차단이 곧 사용자 안전.

기존 코드:
- `supabase/migrations/202605190002_web_push_reminder_dispatches.sql` — `channel` enum에 `'web_push_t60'`, `'web_push_t15'` 정의
- `supabase/migrations/202605190003_web_push_pg_cron_scheduler.sql` — pg_cron 스케줄러
- `app/api/reminders/send-due/route.ts` — dispatch route
- SQL function `get_due_web_push_reminder_candidates`의 멱등성 조건이 `(card_id, scheduled_at, channel)`로 구현됨

이 슬라이스에서:

1. **`fire_window` 신규 칼럼 추가 금지** — 기존 `channel` enum이 같은 의미 인코딩. 동일 의미 중복 회피.
2. **테이블 레벨 UNIQUE 제약 명시화**: `reminder_dispatches`에 `UNIQUE (card_id, scheduled_at, channel)` 제약을 신규 migration으로 추가. 현재는 SQL function의 `not exists` 가드만 존재 → race condition 가능성.
3. **CRON_SECRET Bearer 인증 보강**: `app/api/reminders/send-due/route.ts`에 `Authorization: Bearer $CRON_SECRET` 검증 + 미설정 시 401 + 구조화 로그.

## Acceptance criteria

- [ ] `audit-report-380.md` 생성 (머지 전 삭제):
  - pg_cron extension 활성화 여부 (`SELECT * FROM pg_extension WHERE extname='pg_cron'`)
  - `cron.job`에 `'fevio-reminder-check'` 등록 여부 + 중복 등록 여부
  - `reminder_dispatches` UNIQUE 제약 존재 여부
  - `CRON_SECRET` env var 등록 상태 (Vercel + 로컬 `.env`)
- [ ] supabase/migrations 신규 파일: `reminder_dispatches`에 `UNIQUE (card_id, scheduled_at, channel)` 제약 추가
- [ ] pg_cron job 등록 SQL이 `supabase/migrations`에 포함되어 재현 가능 (없으면 추가)
- [ ] `app/api/reminders/send-due/route.ts`에 `CRON_SECRET` Bearer 검증 + 미설정/불일치 시 401 + 구조화 로그
- [ ] `npm run typecheck` 통과
- [ ] `npm test` 통과
- [ ] 단위 테스트: 동일 `(card_id, scheduled_at, channel)` 2회 insert 시도 시 두 번째가 reject (DB UNIQUE)
- [ ] 통합 테스트: T-15 윈도우 진입 시점에 send-due가 1회만 dispatch 생성
- [ ] 통합 테스트: cron job 1개만 등록 검증 (중복 등록 회귀 가드)
- [ ] migration 적용 후 `cron.job` 조회 결과를 issue comment로 첨부 (또는 deployment gap 명시)

## URL-action-result

`POST /api/reminders/send-due`에 `Authorization: Bearer $CRON_SECRET`으로 요청했을 때, T-15 윈도우 내 confirmed injection 카드 1건당 `reminder_dispatches`에 row가 정확히 1개 생성된다.

## Anti-patterns (reject)

- 신규 `fire_window` 칼럼 추가 (channel enum과 중복)
- pg_cron job에서 직접 user 데이터 변형 (route를 거쳐야 RLS·로깅 일관)
- `CRON_SECRET`을 `NEXT_PUBLIC_` prefix로 노출
- send-due 응답에 user-identifiable 정보 포함

## STOP conditions

- #379(웹 push 발송)가 Red 상태로 확인되면 stop, #379 closure 선행
- Supabase pg_cron extension이 production 플랜 제약으로 활성화 불가하면 stop, alternative scheduler 비교 child issue 생성

## Blocked by

None - can start immediately (parallel with Slice 1, 4a)
