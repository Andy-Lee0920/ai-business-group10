# Codex — Slice 1 (#421) PWA infra closure

## Mission
Issue #421 acceptance 전건 Green + PR. inline CTA 권한 UI + iOS UA stub + ADR 0026.

## 필독 (순서)
1. `prompts/codex/2026-05-28/slice-1-pwa-infra-issue.md` — acceptance/URL-action-result/anti-patterns/STOP 전부
2. `prompts/codex/2026-05-28/README.md` — 공통 엄격 반복
3. `gh issue view 421 --comments`, `gh issue view 377 --comments` (31개 전수)
4. `CLAUDE.md`, `CONTEXT.md`
5. ADR `0004`(헤더 amendment 최신), `0006`, `0013`
6. `docs/03-engineering/schema-rls-matrix.md`
7. 코드: `public/{manifest.json,sw.js}`, `app/api/push/subscribe/route.ts`, `src/lib/pwa-push-client.ts`, `src/features/today/today-screen.tsx`

## Goal
`/(authed)/home`에서 사용자가 inline CTA 클릭 → `push_subscriptions` row 1개 생성.

## Branch & PR
- branch: `feat/421-pwa-inline-cta`
- title: `feat(pwa): #421 closure — inline CTA + iOS UA stub`

## 엄격 반복
각 step: Assumption → Action → Verify(정확 cmd+기대출력) → Red(diagnose+1회 재시도, 2회째도 Red면 `blocker-note-S{N}.md`+STOP) → Green(해당 step 변경분만 commit, Conventional)

## Steps
1. **Audit**: #377 6 acceptance를 코드와 매핑 → `audit-report-377.md` (머지 전 삭제). `docs(audit): #421 audit report`
2. **CTA 컴포넌트**: `src/features/today/PushPermissionCta.tsx`. `onClick`에서만 `Notification.requestPermission`. `useEffect` 자동 호출 금지. unit test로 mount 호출 0회. `feat(pwa): inline CTA component`
3. **iOS UA stub**: `navigator.standalone===false && /iPhone|iPad/.test(UA)` → `requestPermission` skip + 안내 1줄. jsdom mock 검증. `feat(pwa): iOS Safari UA guard`
4. **Home 통합**: `today-screen.tsx` 또는 `home-page-loader.tsx`에 CTA 통합. utility-only 원칙. `feat(pwa): wire CTA into home`
5. **ADR 0026**: `docs/04-decisions/0026-push-permission-ui-trigger.md`. Status=Accepted 2026-05-28. 4 옵션(auto/injection_day/confirm 후/inline CTA) 비교 + Decision=inline CTA + Consequences + Prohibited. `docs(adr): 0026`
6. **e2e**: `tests/e2e/pwa-push-subscribe.spec.ts` — Android default + iPhone13 emulation. `test(e2e): pwa-push-subscribe`
7. **DOD 검증**: `npm run typecheck` && `npm test` && `npm run test:e2e -- tests/e2e/pwa-push-subscribe.spec.ts` 전부 exit 0
8. **PR**: audit-report 삭제, push, `gh pr create` (README hand-off 형식). Issue #421 comment(PR 링크+audit 본문+test 로그)

## DOD
- [ ] typecheck/test/e2e exit 0
- [ ] ADR 0026
- [ ] PR + Issue #421 comment
- [ ] 회귀 가드 unit test(mount 0회 + 거부 후 재요청 0회)

## 금지
- `any`/`Record<string, unknown>`/`@ts-ignore`/`@ts-expect-error`
- `it.skip`/`xit`/`it.todo`
- `git commit --amend`/`--no-verify`
- Issue close
- mount/useEffect에서 `requestPermission` 자동 호출
- `isDemoMode`/`presentationMode` flag를 sw.js·push 도메인에 분기
- 동일 파일 6회 이상 재수정 → loop STOP

## STOP
- VAPID 키 `.env` 부재 → child issue
- iOS install guide UI 요구사항 발견 → child issue
- audit 결과 acceptance 모두 충족 → evidence만 보강 후 close 요청
