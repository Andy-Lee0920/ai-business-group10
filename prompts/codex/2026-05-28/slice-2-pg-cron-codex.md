# Codex — Slice 2 (#422) pg_cron + UNIQUE 명시화

## Mission
Issue #422 acceptance 전건 Green + PR. pg_cron 멱등 등록 + `reminder_dispatches` UNIQUE + `CRON_SECRET` Bearer 인증.

## 필독 (순서)
1. `prompts/codex/2026-05-28/slice-2-pg-cron-issue.md` — 본문 전부
2. `prompts/codex/2026-05-28/README.md`
3. `gh issue view 422 --comments`, `gh issue view 380 --comments`(29전수), `gh issue view 379 --comments`
4. `CLAUDE.md`
5. ADR `0004`(헤더 amendment), `0006`
6. `docs/specs/spec-reminder-dispatch.md`
7. 코드: `supabase/migrations/202605190002_web_push_reminder_dispatches.sql`, `202605190003_web_push_pg_cron_scheduler.sql`, `app/api/reminders/send-due/route.ts`, `src/services/reminder-dispatch-service.ts`, `src/lib/reminder-dispatch-repository.ts`

## Goal
`POST /api/reminders/send-due` with `Authorization: Bearer $CRON_SECRET` → T-15 윈도우 confirmed injection 카드 1건당 `reminder_dispatches` row 정확 1개.

## Branch & PR
- branch: `feat/422-cron-unique`
- title: `feat(scheduler): #422 closure — pg_cron + UNIQUE`

## 엄격 반복
README 공통 규약 적용 (3-strike → blocker-note STOP, Green 파일 재편집 금지).

## Steps
0. **Precondition**: `gh issue view 379` 본문+comments. #379 Red(open+failing test 잔류)면 STOP+blocker-note.
1. **Audit**: pg_cron extension, cron.job 등록, UNIQUE 제약, CRON_SECRET env 4 항목 → `audit-report-380.md`. 원격 접근 불가하면 SQL 정독으로 expected state 추론+deployment gap 표기. `docs(audit): #422`
2. **UNIQUE migration**: `supabase/migrations/{date}_reminder_dispatches_unique.sql` — `add constraint reminder_dispatches_card_time_channel_unique unique (card_id, scheduled_at, channel)`. 기존 중복 가능성 SELECT count by group 검증 쿼리 주석. `feat(schema): UNIQUE (card_id, scheduled_at, channel)`
3. **pg_cron 멱등 등록**: 기존 `202605190003` 또는 신규 migration에 `cron.unschedule` 사전 + `cron.schedule` 재등록. job name 충돌 회귀 가드 주석. `chore(schema): idempotent pg_cron job`
4. **CRON_SECRET Bearer**: `app/api/reminders/send-due/route.ts`에 Authorization 파싱 + `process.env.CRON_SECRET` 정확 일치. 미설정/불일치 → 401 + 구조화 JSON 로그(`{event,reason}`, user 정보 미포함). 통합 테스트 4 case(헤더 없음/Bearer 없음/불일치/일치). `feat(api): cron secret bearer auth`
5. **멱등성 테스트**: unit(동일 키 2회 insert → 두 번째 unique violation) + integration(T-15 진입 시 1회만 dispatch, 동일 호출 2회 연속 → 1개 유지). `test(reminder): idempotency`
6. **DOD**: `npm run typecheck` && `npm test` 전부 exit 0
7. **PR**: push, `gh pr create` (README hand-off 형식). body에 audit 본문 + cron.job 조회 결과 또는 deployment gap 명시. Issue #422 comment.

## DOD
- [ ] typecheck/test exit 0
- [ ] 단위+통합 멱등성 테스트
- [ ] CRON_SECRET 4 case
- [ ] migration 적용 또는 deployment gap 명시
- [ ] PR + Issue #422 comment

## 금지
- 신규 `fire_window` 칼럼 추가 (channel enum 의미 중복)
- `CRON_SECRET`을 `NEXT_PUBLIC_` prefix로 노출
- send-due 응답에 user-identifiable 정보
- pg_cron job에서 직접 user 데이터 변형 (route 경유 필수)
- 그 외 README 공통 금지(any/skip/amend/no-verify/close)

## STOP
- #379 Red → blocker-note(#379 선행 필요)
- Supabase pg_cron 플랜 제약 → alternative scheduler 비교 child issue
- 기존 reminder_dispatches에 중복 row → 데이터 정리 child issue
