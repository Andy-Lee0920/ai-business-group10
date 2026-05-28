## Parent

#377

## What to build

PWA 푸시 알림 인프라 마감 슬라이스. `public/manifest.json`, `public/sw.js`, `app/api/push/subscribe`, `src/lib/pwa-push-client.ts`가 이미 존재한다. Audit으로 #377의 6개 acceptance 중 미충족만 식별 후 다음 결정 기준으로 마감한다.

**결정 1 — 권한 UI 트리거 (ADR 0026 신규)**: Home 또는 Reminder 카드의 사용자 클릭(user gesture)에서만 `Notification.requestPermission` 호출. 컴포넌트 mount/useEffect 자동 호출 금지. 한 번 거부되면 재요청 없음.

**결정 2 — iOS Safari 비설치 처리**: `navigator.standalone === false && /iPhone|iPad/.test(UA)`이면 CTA 클릭이 권한 요청을 호출하지 않고 1줄 안내만 노출. 본격 install guide UI는 별도 child issue.

기존 코드(manifest, sw, subscribe route, VAPID env)가 충족하는 부분은 그대로 두고, 권한 UI와 iOS 분기만 새로 작성한다.

## Acceptance criteria

- [ ] `audit-report-377.md` 생성 (PR root에 임시 작성, 머지 전 삭제): #377의 6개 acceptance를 현재 코드와 매핑, 미충족 항목 분류
- [ ] Home 또는 Reminder 카드에 inline CTA 컴포넌트 추가. user gesture에서만 `requestPermission` 호출
- [ ] iOS Safari 비설치 UA 가드: CTA 클릭 시 권한 요청 0회 + 안내 1줄 노출
- [ ] manifest/sw/VAPID env audit 결과 미충족이 있으면 추가 (없으면 그대로)
- [ ] ADR 0026 (`docs/04-decisions/0026-push-permission-ui-trigger.md`) 작성: 4개 옵션 비교 + inline CTA 결정 + 근거
- [ ] `npm run typecheck` 통과
- [ ] `npm test` 통과 (push 관련 단위 테스트 전부 포함)
- [ ] `tests/e2e/pwa-push-subscribe.spec.ts` 추가 + 통과:
  > "/(authed)/home에서 사용자가 inline CTA 버튼을 능동 클릭했을 때 `push_subscriptions`에 row가 1개 생성된다"
- [ ] Playwright iOS device emulation 통과:
  > iPhone 13 viewport에서 CTA 클릭 시 `Notification.requestPermission` 호출 0회 + 안내 메시지만 노출
- [ ] anti-pattern 회귀 가드 단위 테스트:
  - mount/useEffect에서 자동 호출하지 않음
  - 권한 거부 후 동일 페이지 재방문 시 재요청 호출 0회

## URL-action-result

`/(authed)/home`에서 사용자가 inline CTA를 능동 클릭했을 때 `push_subscriptions`에 row가 생성되어 다음 push 수신이 가능해진다.

## Anti-patterns (reject)

- `isDemoMode` / `presentationMode` flag를 `sw.js` 또는 push 도메인에 분기
- permission prompt를 component mount/useEffect에서 자동 호출
- push 도메인에 `Record<string, unknown>` 또는 `any`
- 알림 권한 요청을 onboarding 흐름에 강제 삽입 (utility-only 원칙)

## STOP conditions

- audit 결과 6개 acceptance 모두 이미 충족이면 evidence comment만 보강 후 close 요청
- VAPID 키가 `.env`에 없으면 stop하고 "환경변수 설정 필요" child issue 생성
- iOS install guide UI 요구사항이 audit에서 발견되면 stop하고 child issue 분리
- 동일 파일을 6회 이상 재수정하면 stop (loop 탐지)

## Blocked by

None - can start immediately (parallel with Slice 2, 4a)
