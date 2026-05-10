# New Issue Backlog — N1 to N10

## Purpose

보드 분할(`docs/03-engineering/project-boards.md`) 과정에서 발견된 10개의 신규 이슈 초안. 각 이슈는 `docs/03-engineering/issue-writing-rules.md` body grammar를 따른다. 권한이 발급되면 이 본문 그대로 `gh issue create` 또는 GitHub UI로 열 수 있다.

## Index

| ID | GitHub | Title | Board | Priority | Blocked by |
|---|---|---|---|---|---|
| N1 | #52 | [P0] 알림 0 — 확정 주사 카드 in-app 강조 + email 1회 (Reminder Minimum) | 5 | P0 | `#25`, `#26`, `#59` |
| N2 | #53 | [P0] 공유 5.1 — 파트너에게 보일 카드 필드만 골라 보이게 하기 (Partner Whitelist) | 4 | P0 | `#27` |
| N3 | #54 | [P0] 판단 2.1 — 파트너가 보고 행동할 수 있는 description 가이드 | 3 | P0 | `#25` |
| N4 | #55 | [ADR] 일정 모델 결정 — care_action_cards.scheduled_at 단일 vs visits 테이블 | 3 | P0 gate | — |
| N5 | #56 | [P0] 출시 점검 — SLC release-gate manual QA 체크리스트 | 3 | P0 | `#23`, `#24`, `#25`, `#26`, `#27`, `#52` |
| N6 | #57 | [Ops] PR마다 Vercel Preview SOP — 변경 검증 흐름 정리 | 7 | P1 | — |
| N7 | #58 | [P0] 진입 1.1 — Privacy Gate에 "삭제 요청 v1.x" 마이크로카피 추가 | 1 | P0 | `#23` |
| N8 | #59 | [ADR] 알림 채널 결정 — Web Push vs Email vs PWA install | 5 | P0 gate | — |
| N9 | #60 | [P1] 판단 2.2 — Korean IVF keyword 확장 review 루프 | 2 | P1 | `#25` |
| N10 | #61 | [P0] 공유 5.2 — Partner share link 회수 UI | 4 | P0 | `#27` |

라벨 가이드

- P0 신규: `p0`, `area:<board-suffix>`, `gate:slc-release`
- ADR gate(N4, N8): `p0`, `decision:adr`, `area:<board-suffix>`
- Ops(N6): `area:ops`
- 모든 신규: 부모 epic — `#29`(SLC) 또는 `#43`(Original-pain)에 연결

---

## N1 — [P0] 알림 0 — 확정 주사 카드 in-app 강조 + email 1회 (Reminder Minimum)

### Parent

Epic `#29`. Spawned by ADR 0002 룰 #49-A.

### 원문 출처

`original-note-hyunjoo.md` §5-2 약/주사 관리, §5-6 오프라인/알림 실패 대응, §6-1 실수 방지 강화

### 한 줄 목표

확정된 주사 카드가 시간이 임박하면 화면이 먼저 알리고, 탭이 닫혀 있어도 30분 전에 이메일이 한 번 도착한다.

### 사용자가 보게 될 변화

오늘 21시 주사 카드가 있으면, 20시 30분에 가입 이메일로 1회 리마인드를 받는다. 그 시점에 앱을 열어두면 카드가 자동으로 상단으로 올라오고 "지금 ±30분" 표시가 보인다.

### 왜 필요한가

원문은 "놓칠 경우 시술 자체가 취소될 수 있음"이라고 명시한다. webapp 우선·LLM 비의존 SLC 결정 위에서, 카카오 알림톡/SMS/네이티브 push 없이도 가능한 최소 안전망을 첫 출시에 포함한다.

### 이번 이슈에서 할 일

- [ ] in-app 강조: `#25`의 `computeDisplaySafetyLevel` critical 판정과 `#26`의 home composition을 연결한다.
- [ ] email channel: Supabase Edge Function `send-reminder` 작성, transactional mail provider(예: Resend/SES — `N8`에서 결정)와 연결.
- [ ] schedule trigger: `care_action_cards.scheduled_at` 30분 전 발송. 중복 방지 키 = `(card.id, scheduled_at)`.
- [ ] template: 한국어, 의료 조언 금지 문구, 카드 title + scheduled_at + 앱 deep link만 포함.
- [ ] integration test: confirmed injection 카드 + scheduled_at 30분 후 → reminder log row 1개 + email 1건.
- [ ] e2e (Vercel Preview): seed 카드를 만들고 시간을 가짜로 흘려 30분 전 발송이 트리거되는 것을 시연.

### 이번 이슈에서 하지 않을 일

- [ ] 카카오 알림톡, SMS, native push (P1++).
- [ ] PWA install 안내 (후속).
- [ ] 사용자 알림 설정 화면 고도화 (toggle 1개만).
- [ ] LLM이 알림 문구를 생성하지 못하게 한다.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/original-note-hyunjoo.md, docs/04-decisions/0002-p0-boost-rules.md,
docs/03-engineering/project-boards.md를 먼저 읽고,
TDD로 red → green → refactor 순서로 진행해.
이번 PR에서는 의료 판단/카카오 알림톡/SMS/네이티브 push를 만들지 마.
완료 시 변경 파일, 테스트 결과, 남은 리스크를 보고해.
```

비개발자도 기여할 수 있는 부분

- 이메일 본문 톤·표현 리뷰 (불안 유발 표현 제거)
- 시각 강조가 모바일에서 과하지 않은지 스크린샷 리뷰
- "지금 ±30분" 카피 대안 제안

### TDD 시작점

RED: confirmed injection 카드 1건과 `scheduled_at = now+30m`이 주어졌을 때, scheduler가 30분 전 윈도우에서 reminder log row 1개를 만든다.

### 완료 기준

- [ ] critical 판정 단위 테스트 통과 (`#25`와 공유)
- [ ] home composition에서 critical 카드가 상단 고정 + 시각·텍스트 강조
- [ ] email 1회 발송 + 중복 방지 (재시도해도 row 1개)
- [ ] Vercel Preview에서 e2e 시연 가능
- [ ] 의료 판단 문구 없음 (template gold test)

### Blocked by

`N8` (알림 채널 ADR), `#25` (Card Model), `#26` (Dynamic Home)

### 개발 메모

- Tables/columns: `care_action_cards.scheduled_at`, 신규 `reminder_dispatches(card_id, scheduled_at, channel, status, sent_at)` UNIQUE(card_id, scheduled_at, channel).
- Edge Function: `/functions/v1/send-reminder`
- Provider env: `RESEND_API_KEY` 또는 `SES_*` (N8 결정에 따라)
- Cron: pg_cron 또는 Supabase Scheduled Function, 1분 단위.

### 연결 문서

- ADR 0002: `docs/04-decisions/0002-p0-boost-rules.md`
- Project boards: `docs/03-engineering/project-boards.md`
- PRD §10.4 display safety: `docs/01-product/prd-v1.0.md`

---

## N2 — [P0] 공유 5.1 — 파트너에게 보일 카드 필드만 골라 보이게 하기 (Partner Whitelist)

### Parent

Child of `#27`. Spawned by ADR 0002 룰 #27-A.

### 원문 출처

`original-note-hyunjoo.md` §5-3 부부 공유 기능, §5-7 데이터 민감성

### 한 줄 목표

파트너 화면이 안전한 필드만 server-filtered로 노출하고, 그 외 어떤 민감 정보도 새지 않게 한다.

### 사용자가 보게 될 변화

파트너는 카드 제목·시간·종류·사용자가 confirm한 본문·변경 상태만 본다. 원본 메모, 다른 카드, 감정 기록 등은 보이지 않는다.

### 왜 필요한가

`#27` 본문은 "sanitized"라는 추상어로 정의되어 있다. 화이트리스트가 contract test로 고정되지 않으면, 향후 필드 추가 PR이 부주의로 민감 정보를 노출할 수 있다.

### 이번 이슈에서 할 일

- [ ] partner view payload schema를 TypeScript type + JSON schema로 정의: `title`, `scheduled_at`, `card_type`, `description`, `display_state`.
- [ ] server-side serializer 작성. 다른 필드가 새어나오면 throw.
- [ ] contract test: extra 필드 발견 시 fail.
- [ ] integration test: `partner_visible=false` 카드는 결과에서 제외.
- [ ] e2e: raw_text가 어떤 응답에도 들어있지 않다.

### 이번 이슈에서 하지 않을 일

- [ ] partner view UI 전체 구현 (`#27` 본체).
- [ ] 새로운 필드 추가 (가이드만 정의).
- [ ] partner 계정/auth.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/04-decisions/0002-p0-boost-rules.md를 먼저 읽고,
contract test부터 작성한 뒤 serializer를 그것에 맞춰 구현해.
이번 PR에서는 partner UI 전체나 partner auth는 손대지 마.
완료 시 변경 파일, 테스트 결과, 남은 리스크를 보고해.
```

비개발자도 기여할 수 있는 부분

- 화이트리스트 항목이 파트너에게 의미 있는지 리뷰
- 추가가 필요한 필드 제안 (이슈 코멘트로)

### TDD 시작점

RED: serializer 출력에 `raw_text` 또는 `visit_inputs.id`가 포함되면 contract test가 fail한다.

### 완료 기준

- [ ] schema·type·serializer가 PR에 함께 포함
- [ ] contract test 통과
- [ ] partner_visible=false 카드 누락 통합 테스트 통과
- [ ] e2e raw memo 누설 0건

### Blocked by

`#27` (Partner Link)

### 개발 메모

- Type: `PartnerCardView` (PRD §14.4 `PartnerActionViewItem` 기반).
- File: `src/services/partner-view.ts`, `src/types/partner-view.types.ts`, `tests/unit/partner-view.test.ts`, `tests/integration/partner-view.test.ts`.

### 연결 문서

- ADR 0002, PRD §14.4

---

## N3 — [P0] 판단 2.1 — 파트너가 보고 행동할 수 있는 description 가이드

### Parent

Child of `#25`. Spawned by ADR 0002 룰 #27-A.

### 원문 출처

`original-note-hyunjoo.md` §5-3 인터뷰이 B (남편이 직접 주사 투여), §6-1 실수 방지

### 한 줄 목표

`care_action_cards.description`에 들어가는 내용 규약을 정해, 파트너가 카드만 보고 행동할 수 있되 의료 판단 영역은 침범하지 않게 한다.

### 사용자가 보게 될 변화

사용자가 confirm한 description에 "고날에프 1회, 21시"처럼 행동 단서가 들어간다. "용량을 올리세요" 같은 의료 판단 표현은 confirmation 단계에서 차단된다.

### 왜 필요한가

`#27`이 description을 partner에 노출하기로 결정(`#27-A`)되면, description의 콘텐츠 규약이 없으면 파트너가 빈 카드만 보거나, 반대로 의료 판단 텍스트가 새어 나간다.

### 이번 이슈에서 할 일

- [ ] description 콘텐츠 규약 문서를 `docs/04-decisions/` 또는 `docs/specs/`에 추가.
- [ ] 허용 표현 (행동·시간·종류·횟수)과 금지 표현 (용량 조정·진단·성공률·치료 전략) 카탈로그.
- [ ] confirm 화면에 description 작성 hint + 금지 표현 검출 시 경고 (차단은 아님 — 사용자 책임).
- [ ] 단위 테스트: 금지 표현 패턴 매칭 함수.

### 이번 이슈에서 하지 않을 일

- [ ] LLM이 description을 생성하게 만들기.
- [ ] description 자유 입력 차단 (사용자가 결정하는 텍스트임).
- [ ] 의료 검수 워크플로 도입.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/original-note-hyunjoo.md, docs/01-product/prd-v1.0.md §16,
docs/04-decisions/0002-p0-boost-rules.md를 읽고 시작해.
이번 PR에서는 LLM 자동 생성과 의료 검수 워크플로를 만들지 마.
완료 시 변경 파일, 테스트 결과, 남은 리스크를 보고해.
```

비개발자도 기여할 수 있는 부분

- 허용/금지 표현 카탈로그 리뷰
- confirm 화면 hint 카피 제안

### TDD 시작점

RED: "용량을 올리세요"가 description에 포함되면 검출 함수가 truthy를 반환한다.

### 완료 기준

- [ ] 콘텐츠 규약 문서 머지
- [ ] confirm 화면에 hint 노출
- [ ] 금지 표현 검출 단위 테스트 통과
- [ ] e2e: 사용자가 confirm한 description이 partner view에 그대로 보임

### Blocked by

`#25` (Card Model)

### 개발 메모

- File: `src/utils/description-guard.ts`, `tests/unit/description-guard.test.ts`.
- Doc: `docs/specs/description-content-rules.md` (신규).

### 연결 문서

- ADR 0002, PRD §16

---

## N4 — [ADR] 일정 모델 결정 — care_action_cards.scheduled_at 단일 vs visits 테이블

### Parent

Gate for `#25`, `#44`.

### 원문 출처

`original-note-hyunjoo.md` §1 일정 관리, §5-1, §6-3

### 한 줄 목표

병원 방문 일정을 별도 entity로 모델링할지, `care_action_cards.scheduled_at` 단일 컬럼으로 흡수할지를 SLC 진입 전에 결정한다.

### 사용자가 보게 될 변화

직접 보이지 않지만, "당일 일정 변경"·"다음 방문 표시" 같은 P1 시나리오를 깔끔하게 풀 수 있는 데이터 구조가 결정된다.

### 왜 필요한가

`#25`(Card Model)와 `#44`(Clinic Schedule) 사이에 결정 게이트가 없다. SLC가 끝난 뒤 P1로 진입할 때 schema migration이 비대해질 위험이 있다.

### 이번 이슈에서 할 일

- [ ] 옵션 A: `care_action_cards.scheduled_at` + `card_type='clinic_visit'`만 사용 (단일 모델).
- [ ] 옵션 B: 신규 `clinic_visits` 테이블 + `care_action_cards.visit_id` FK (분리 모델).
- [ ] 옵션 C: 옵션 A로 SLC 출시 후, P1에서 옵션 B로 migration (단계적).
- [ ] 의사결정 기준: P1 #44 시나리오(반복 일정·당일 변경)가 어느 모델에서 더 단순한가, RLS·인덱스·partner view 영향.
- [ ] ADR `0003-schedule-model.md` 작성·머지.

### 이번 이슈에서 하지 않을 일

- [ ] 실제 마이그레이션 작성 (결정만).
- [ ] 캘린더 UI 설계 (`#44`에서).

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/prd-v1.0.md §12, docs/03-engineering/schema-rls-matrix.md를 읽고,
세 옵션을 표로 비교한 뒤 권장안을 ADR로 머지해.
이번 PR에서는 schema migration이나 UI를 작성하지 마.
```

비개발자도 기여할 수 있는 부분

- 사용자 시나리오 보강 (당일 변경·반복·취소 패턴)

### TDD 시작점

문서 테스트: ADR `0003-schedule-model.md`가 머지되어 있고, `#44` 본문에 채택 옵션이 인용되어 있는가.

### 완료 기준

- [ ] ADR 0003 머지
- [ ] `#25`·`#44` 본문에 채택 옵션 인용
- [ ] schema-rls-matrix에 영향 표시

### Blocked by

— (선결 결정)

### 개발 메모

- Output: `docs/04-decisions/0003-schedule-model.md`
- Reference: PRD §12 data model

### 연결 문서

- Project boards Board 3, original-note §1/§5-1/§6-3

---

## N5 — [P0] 출시 점검 — SLC release-gate manual QA 체크리스트

### Parent

Child of `#29` Epic.

### 원문 출처

`original-note-hyunjoo.md` 전체 (출시 신뢰 기준)

### 한 줄 목표

SLC release를 누군가가 "끝났다"고 부르려면 구체적으로 무엇을 직접 눌러보고 무엇을 봐야 하는지 한 페이지로 만든다.

### 사용자가 보게 될 변화

릴리즈 검증자(개발자/PO)는 체크리스트의 모든 항목을 직접 수행하고 스크린샷을 첨부한 뒤에야 SLC가 닫혔다고 선언할 수 있다.

### 왜 필요한가

자동 테스트만으로는 모바일 viewport·실제 OAuth·실제 메일 도착·실제 partner link 흐름을 검증하기 어렵다. 보드의 `Done` 컬럼 진입 조건이 통일된다.

### 이번 이슈에서 할 일

- [ ] `docs/03-engineering/slc-release-gate-checklist.md` 신규 작성.
- [ ] `slc-target.md` release gate 항목 + ADR 0002 보정 항목 + N1·N2·N3 acceptance를 모두 체크박스로 정렬.
- [ ] 항목별로 "실제 어떤 화면에서 무엇을 누르고 무엇을 본다"를 1~2 문장으로 명시.
- [ ] 릴리즈 PR 템플릿에 이 체크리스트 링크 삽입.

### 이번 이슈에서 하지 않을 일

- [ ] 자동 e2e 추가 (개별 P0 이슈에서).
- [ ] 외부 QA 인력 도입.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/slc-target.md, docs/04-decisions/0002-p0-boost-rules.md,
docs/03-engineering/project-boards.md SLC release-gate burnup 섹션을 읽고,
같은 항목을 누락 없이 체크리스트로 옮겨.
이번 PR에서는 새 acceptance를 추가하지 마.
```

비개발자도 기여할 수 있는 부분

- 체크 항목 한국어 표현이 검증자에게 명확한지 리뷰

### TDD 시작점

문서 테스트: 체크리스트 항목 수가 `slc-target.md` release gate 항목 수 + ADR 0002 추가 항목 수와 일치한다.

### 완료 기준

- [ ] 체크리스트 머지
- [ ] PR 템플릿 링크 삽입
- [ ] 보드 `Done` 컬럼 정의 갱신 (이 체크리스트 인용)

### Blocked by

`#23`, `#24`, `#25`, `#26`, `#27`, `N1` (모두 acceptance 확정 후 정렬 가능)

### 개발 메모

- File: `docs/03-engineering/slc-release-gate-checklist.md`
- PR template: `.github/PULL_REQUEST_TEMPLATE.md`

### 연결 문서

- SLC target, ADR 0002, project-boards SLC burnup

---

## N6 — [Ops] PR마다 Vercel Preview SOP — 변경 검증 흐름 정리

### Parent

Board 7 Foundation & Ops.

### 원문 출처

`slc-target.md` (Vercel Preview 검증 의존), 보드 분할 시 발견된 갭

### 한 줄 목표

PR을 열면 누구든 동일한 절차로 Vercel Preview를 열고, 모바일 뷰에서 변경 영역을 검증한 뒤 결과를 PR 코멘트로 남긴다.

### 사용자가 보게 될 변화

PR 페이지에 Preview URL + 모바일 viewport 스크린샷 + 검증 항목 체크가 일관되게 붙는다.

### 왜 필요한가

검증 절차가 사람마다 다르면 SLC release gate가 무의미해진다. 보드 분할로 PR 빈도가 늘어나기 전에 형식을 정한다.

### 이번 이슈에서 할 일

- [ ] `docs/03-engineering/vercel-preview-sop.md` 작성: PR 열기 → Preview URL 확인 → 모바일 viewport 검증 → 스크린샷 첨부 → 체크 코멘트.
- [ ] PR template에 SOP 링크 + 최소 체크 3개.
- [ ] GitHub Actions(또는 수동) — Preview URL 상태 코드 200 확인.

### 이번 이슈에서 하지 않을 일

- [ ] 자동 visual regression 도입 (후속).
- [ ] CI 게이트로 머지 차단 (협의 후).

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/03-engineering/deployment-readiness.md를 읽고,
SOP 문서와 PR 템플릿 변경을 한 PR에 묶어줘.
```

비개발자도 기여할 수 있는 부분

- 체크 항목 사용성 리뷰

### TDD 시작점

문서 테스트: PR template에 SOP 링크가 있고, SOP 문서가 존재한다.

### 완료 기준

- [ ] SOP 문서 머지
- [ ] PR template 갱신
- [ ] 다음 PR 1건이 SOP대로 진행된 증거

### Blocked by

— 

### 개발 메모

- File: `docs/03-engineering/vercel-preview-sop.md`, `.github/PULL_REQUEST_TEMPLATE.md`

### 연결 문서

- `docs/03-engineering/deployment-readiness.md`

---

## N7 — [P0] 진입 1.1 — Privacy Gate에 "삭제 요청 v1.x" 마이크로카피 추가

### Parent

Child of `#23`.

### 원문 출처

`original-note-hyunjoo.md` §5-7 데이터 민감성 (탈퇴/삭제 정책)

### 한 줄 목표

Privacy Gate에서 "지금은 self-serve 삭제가 없으나 요청은 메일로 받아 v1.x에서 처리한다"를 명시한다.

### 사용자가 보게 될 변화

Privacy Gate 화면에 한 줄로 "삭제 요청은 [메일주소]로 보내주시면 [기간] 안에 처리됩니다 (자동 삭제는 v1.x 예정)"이 보인다.

### 왜 필요한가

`#50`(Privacy/Delete)가 P1이라 SLC에서는 self-serve 삭제 기능이 없다. 안내 없이 release하면 사용자 신뢰가 떨어지고 PIPA 분쟁 여지가 생긴다.

### 이번 이슈에서 할 일

- [ ] Privacy Gate 화면 컴포넌트에 안내 마이크로카피 추가.
- [ ] 메일주소 env 또는 config로 외부화 (`PRIVACY_CONTACT_EMAIL`).
- [ ] e2e: 안내 문구가 Privacy Gate에서 보인다.

### 이번 이슈에서 하지 않을 일

- [ ] 삭제 기능 구현 (`#50`).
- [ ] 별도 메일 라우팅 시스템.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/original-note-hyunjoo.md §5-7과 PRD §7.1을 읽고,
한 줄 카피만 추가하는 surgical change로 진행해.
```

비개발자도 기여할 수 있는 부분

- 마이크로카피 톤 리뷰

### TDD 시작점

RED: Privacy Gate 페이지 e2e 스냅샷에 "삭제 요청"이 등장한다.

### 완료 기준

- [ ] 마이크로카피 노출
- [ ] env 외부화
- [ ] e2e 통과

### Blocked by

`#23`

### 개발 메모

- File: `app/privacy/page.tsx`, `src/config/index.ts`
- Env: `PRIVACY_CONTACT_EMAIL`

### 연결 문서

- PRD §7.1, original §5-7

---

## N8 — [ADR] 알림 채널 결정 — Web Push vs Email vs PWA install

### Parent

Gate for `N1`.

### 원문 출처

`original-note-hyunjoo.md` §5-6 알림 실패 대응

### 한 줄 목표

`N1` P0 reminder 채널을 Web Push API / Email-only / PWA install nudge 중 하나로 결정한다.

### 사용자가 보게 될 변화

직접 보이지 않지만, `N1` 구현이 채택 채널 위에서 진행된다.

### 왜 필요한가

채널마다 인프라 비용·iOS 제약·전송률·사용자 친화도가 크게 다르다. `N1`이 시작되기 전에 하나로 좁혀야 한다.

### 이번 이슈에서 할 일

- [ ] 옵션별 표 비교: 인프라 비용, iOS Safari 지원, 사용자 동의 흐름, 발송 신뢰도, SLC release gate 영향.
- [ ] 권장안: Email-only (단순·iOS 호환·SLC 안에 안전 진입). Web Push는 P1.
- [ ] ADR `0004-reminder-channel.md` 머지.

### 이번 이슈에서 하지 않을 일

- [ ] 실제 발송 코드.
- [ ] PWA install 자체 결정 (별도).

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/04-decisions/0002-p0-boost-rules.md를 읽고,
세 옵션을 표로 비교한 뒤 ADR로 머지해.
```

비개발자도 기여할 수 있는 부분

- 사용자 친화도 관점 의견

### TDD 시작점

문서 테스트: ADR 0004가 머지되어 있고 `N1` 본문이 채택 채널을 인용한다.

### 완료 기준

- [ ] ADR 0004 머지
- [ ] `N1` 본문 갱신

### Blocked by

—

### 개발 메모

- Output: `docs/04-decisions/0004-reminder-channel.md`

### 연결 문서

- ADR 0002, original §5-6

---

## N9 — [P1] 판단 2.2 — Korean IVF keyword 확장 review 루프

### Parent

Child of `#43` (Original-pain Expansion).

### 원문 출처

`original-note-hyunjoo.md` §5-2 약/주사 (인터뷰이 A 약 혼동)

### 한 줄 목표

`#25` `inferCardType`이 사용하는 한국어 IVF keyword 사전을, 실제 메모로부터 분기마다 확장·검증한다.

### 사용자가 보게 될 변화

사용자가 새로 입력한 메모에서 카드 타입이 정확히 분류되는 비율이 분기마다 올라간다.

### 왜 필요한가

`#25` keyword(PRD §10.3)는 문헌 기반이다. 현장 메모와 어휘가 다를 수 있어, 회수 채널 없이는 정확도가 정체된다.

### 이번 이슈에서 할 일

- [ ] 분기별 review 페이지: 미분류 또는 `general_action` 비율 + 사용자 수정 사례.
- [ ] keyword PR 워크플로: 새 단어 추가 시 단위 테스트로 회귀 보호.
- [ ] 사용자 수정 로그(privacy-safe) 집계 함수.

### 이번 이슈에서 하지 않을 일

- [ ] LLM이 keyword를 자동 확정.
- [ ] 의료 용어 사전 도입.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/prd-v1.0.md §10.3을 읽고,
keyword 확장 PR 1건과 review 페이지 stub을 묶어서 진행해.
이번 PR에서는 LLM 자동화나 의료 사전을 도입하지 마.
```

비개발자도 기여할 수 있는 부분

- 실제 메모 예시 제공
- 단어 후보 제안

### TDD 시작점

RED: 새로 추가하려는 keyword가 기존 분류 결과를 깨지 않는 회귀 테스트가 먼저 fail로 시작.

### 완료 기준

- [ ] review 페이지 stub
- [ ] keyword 확장 1건 머지
- [ ] 회귀 테스트 통과

### Blocked by

`#25`

### 개발 메모

- File: `src/utils/card-type-keywords.ts`, `tests/unit/infer-card-type.test.ts`

### 연결 문서

- PRD §10.3

---

## N10 — [P0] 공유 5.2 — Partner share link 회수 UI

### Parent

Child of `#27`.

### 원문 출처

`original-note-hyunjoo.md` §5-3, §5-7

### 한 줄 목표

사용자가 만든 partner share link를 한 번의 동작으로 회수할 수 있는 UI를 제공한다.

### 사용자가 보게 될 변화

사용자는 설정/공유 화면에서 활성 링크 목록을 보고, "회수" 버튼으로 즉시 무효화한다. 이미 열린 파트너 화면은 다음 요청부터 "이 링크는 더 이상 유효하지 않아요"가 보인다.

### 왜 필요한가

`#27` 본문은 revoke 지원을 명시하지만 UI 위치가 미정이다. 회수 수단 없이 release되면 신뢰 결손.

### 이번 이슈에서 할 일

- [ ] 활성 링크 목록 화면 (만든 시각, 만료 예정, 마지막 접근, 회수 버튼).
- [ ] 회수 confirm 모달.
- [ ] 서버 endpoint: `POST /api/partner-share-links/:id/revoke` (RLS 안전).
- [ ] e2e: 회수 후 partner page가 expired/revoked 상태를 본다.

### 이번 이슈에서 하지 않을 일

- [ ] 자동 만료 정책 변경 (`#27` 본체).
- [ ] 신규 link 생성 UI 변경.

### Claude Code/Codex로 기여하는 방법

```text
이 GitHub 이슈를 해결해줘: <issue-url>
반드시 docs/01-product/prd-v1.0.md §14, docs/04-decisions/0002-p0-boost-rules.md를 읽고,
revoke endpoint와 UI를 한 PR에 묶어 진행해.
```

비개발자도 기여할 수 있는 부분

- 회수 버튼 카피·confirm 문구 리뷰

### TDD 시작점

RED: revoke endpoint 호출 후 partner view fetch가 revoked 상태를 반환한다.

### 완료 기준

- [ ] 활성 링크 목록 노출
- [ ] revoke endpoint + RLS 테스트
- [ ] e2e 통과

### Blocked by

`#27`

### 개발 메모

- File: `app/(authed)/settings/sharing/page.tsx` (또는 동등 경로), `app/api/partner-share-links/[id]/revoke/route.ts`
- Tables: `partner_share_links`

### 연결 문서

- PRD §14, ADR 0002, project-boards Board 4
