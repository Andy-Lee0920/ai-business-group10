# ADR 0002 — P0 boost rules for #25 / #27 / #49

## Status

Accepted — 2026-05-10

## Context

SLC gate (`docs/01-product/slc-target.md`)는 첫 출시 범위를 작게 유지하기 위한 합의다. 그러나 제품 원문(`docs/01-product/original-note-hyunjoo.md`)이 가장 절박하게 가리키는 두 가지 통증을 SLC P0 구성이 구조적으로 약화시킨다는 점이, 보드 분할(`docs/03-engineering/project-boards.md`) 작업 중 드러났다.

- §5-2 / 인터뷰이 A — 약 혼동·주사 누락. 원문 표현: "놓칠 경우 시술 자체가 취소될 수 있음." SLC는 카드 모델/홈까지만 다루고 안전망(시간 강조·재알림)이 P0에 없다.
- §5-3 / 인터뷰이 B — 남편이 직접 주사를 놓아야 함. 현행 `#27` Partner View는 read-only sanitized로 정의되어 있어 남편이 카드만 보고 행동할 단서가 부족하다.

ADR 0001(SLC-first, manual-first)을 뒤집지 않으면서, 이 두 통증을 첫 출시 안에 녹이려면 기존 P0 이슈의 acceptance를 좁게 강화하고 P1 알림 이슈에서 "webapp으로 가능한 최소 안전망"만 떼어 P0로 옮기는 방식이 필요하다.

## Decision

세 개의 보정 룰을 채택한다.

### Rule #25-A — In-app time emphasis for confirmed injection cards

`#25` (Card Model)에 다음 acceptance를 추가한다.

- 단위 테스트: `computeDisplaySafetyLevel(card, now)`는 `card.card_type === "injection"`이고 `scheduled_at`이 `now ± 30분` 윈도우 안일 때 `"critical"`을 반환한다.
- 홈 합성(`#26` 가시 결과): `display_safety_level === "critical"` 카드는 상단 고정 + 시각 강조(coral background or border) + 텍스트 강조("지금 ±30분"·"시간 다 됐어요").
- E2E: 임박 injection 카드가 다른 confirmed 카드보다 위에 렌더된다.

원칙

- 우선순위는 사용자가 confirm한 `scheduled_at`을 기준으로 한다. 모델/시스템이 의료 판단으로 결정하지 않는다.
- `display_safety_level`은 UI 우선순위 계산일 뿐, DB에 의료 판단 컬럼으로 저장되지 않는다 (PRD §10.4와 일치).

### Rule #27-A — Partner action whitelist

`#27` (Partner Link)에 다음 acceptance를 추가한다.

- Server-filtered partner view가 노출하는 필드: `title`, `scheduled_at`, `card_type`, `description`, `display_state`. (description은 사용자가 confirm한 `care_action_cards.description` 텍스트만.)
- Server-filtered partner view가 절대 노출하지 않는 필드/리소스: `visit_inputs.raw_text`, `partner_visible=false` 카드, emotional log, audit log, share token raw, 다른 카드의 source_text.
- Contract test: partner view payload schema가 위 화이트리스트와 정확히 일치(추가 필드 누설 시 실패).
- E2E: 파트너가 카드 본문만 보고 행동에 필요한 단서(예: "오늘 21시 고날에프 1회")를 얻는다. raw memo 누설은 0건.

원칙

- confirmation-first 규약 위에서, 사용자가 확인한 description은 partner에게 흐를 수 있다.
- LLM이 생성하고 사용자가 미확정한 텍스트는 partner view로 흐르지 않는다.

### Rule #49-A — Carrier fallback split, P0 minimum reminder spawned

`#49`을 둘로 나눈다.

- `#49`은 P1으로 유지: 카카오 알림톡 + SMS carrier fallback (인프라·계약·비용·발신자 검수가 필요해 SLC 안에 들어오기 어렵다).
- 신규 `N1` [P0] 생성: in-app 시간 강조(룰 #25-A의 표현 레이어와 겹침) + 임박 30분 전 email 1회 리마인드 (Supabase Edge Function + transactional mail).
- 신규 `N8` [ADR P0 gate]: 알림 채널 결정 — Web Push API + Service Worker / Email-only / PWA install nudge 중 N1 P0 채널 1개 선택. native push, kakao 알림톡, SMS는 P1++.

원칙

- "놓치면 시술 취소"라는 원문 안전망이 첫 출시에 0이어선 안 된다.
- N1은 다른 P0를 막지 않는다. N8가 지연되면 in-app 강조만 우선 release하고 email 채널은 N1 child로 분리한다.

## Consequences

쉬워지는 것

- 원문 두 통증(타이밍 + 남편 active 실행)이 첫 출시 SLC 안에 들어온다.
- P1 알림 확장(#49)이 빈 캔버스가 아닌 stable baseline(in-app + email) 위에서 자란다.
- Partner View가 read-only 박제 화면이 아니라, 실제로 행동할 수 있는 surface가 된다.

어려워지는 것

- `#25`/`#26`/`#27` acceptance가 각 1~2 줄씩 늘어 P0 surface area가 약간 넓어진다.
- N1이 transactional email provider 의존성을 끌어온다 (N8 ADR로 게이트).
- Partner View contract test 1건이 SLC release-gate에 추가된다.

금지되는 것

- LLM이 생성한 미확정 description을 partner view로 흘리는 것.
- `display_safety_level` 또는 critical 판정을 DB에 의료 판단 컬럼으로 저장하는 것.
- N1 email 채널 결정(N8) 지연을 이유로 다른 P0 진행을 멈추는 것.
- carrier fallback(카카오/SMS)을 N1 P0 안에 끌어오는 것.

## Test additions (요약)

- Unit: `computeDisplaySafetyLevel` 임박 윈도우 — `tests/unit/care-day.test.ts` (#25)
- Contract: partner view payload schema — `tests/integration/partner-view-payload.test.ts` (#27 + N2)
- E2E: 임박 injection 카드 정렬 — `tests/e2e/home-injection-imminent.spec.ts` (#25 + #26)
- E2E: 파트너 description 행동 단서 — `tests/e2e/partner-description-actionable.spec.ts` (#27 + N3)
- E2E: email 1회 리마인드 (Vercel Preview) — `tests/e2e/reminder-email-once.spec.ts` (N1)

## Rollback

룰 #25-A·#27-A는 acceptance 줄을 제거하고 PR을 revert하면 원복된다. 룰 #49-A는 N1을 close + reopen `#49` body의 "P1로 유지" 표현 제거로 되돌릴 수 있다. ADR 0001은 영향받지 않는다.

## Related

- ADR 0001 — SLC-first, manual-first: `docs/04-decisions/0001-slc-first-manual-first.md`
- Issues affected: `#25`, `#27`, `#49`
- New issues spawned: `N1`, `N2`, `N3`, `N8` (상세 본문은 `docs/03-engineering/new-issues-backlog.md`)
- Board placement: `docs/03-engineering/project-boards.md`
- Source of pain: `docs/01-product/original-note-hyunjoo.md` §5-2, §5-3, §5-6, §6-1
