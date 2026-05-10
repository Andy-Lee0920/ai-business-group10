# SLC TDD Issue Map

## Operating decision

- SLC is one final product target.
- TDD runs as small verification loops per issue.
- PRs should be split by issue where practical.
- Development can be planned in a larger group, but implementation should still move through tracer bullets.

## Group execution shape

### Group A — Foundation first

Issues:

- #32 준비 0 — Vercel에서 열리는 웹앱 뼈대 만들기
- #33 준비 0.1 — SLC 성공 기준을 한 문서로 고정하기
- #34 준비 0.2 — 따뜻한 모바일 화면 규칙 만들기
- #35 준비 0.3 — 커플 데이터가 섞이지 않게 DB 규칙 세우기

Primary goal:

Create an executable app/test/schema foundation without implementing the full SLC loop yet.

First tests:

- `/` renders mobile shell.
- env validation is explicit.
- design tokens are available to UI primitives.
- schema/RLS matrix names every table owner and test.

### Group B — Auth and data boundary

Issues:

- #23 진입 1 — 구글 로그인 후 개인정보 동의까지 끝내기
- #35 schema/RLS follow-through

First tests:

- new authenticated user bootstrap is idempotent.
- privacy gate not accepted → sensitive write rejected.
- couple-scoped data is isolated by RLS.

### Group C — Care action creation

Issues:

- #25 판단 2 — 오늘 상황에 맞는 할 일 카드 규칙 만들기
- #24 기록 3 — 병원 메모를 오늘 할 일 카드로 확정하기

First tests:

- `computeCareDay()` returns onboarding before first capture.
- line split produces candidate actions from Korean clinic memo.
- Capture writes `visit_inputs` + `action_split_drafts` only.
- Confirm atomically writes `split_candidates` + `care_action_cards` and sets `first_capture_completed_at` once.

### Group D — Home and partner projection

Issues:

- #26 홈 4 — 오늘 치료 상황에 맞춰 홈 화면 바꾸기
- #27 공유 5 — 파트너에게 7일짜리 오늘 할 일 링크 보내기

First tests:

- confirmed injection card triggers `injection_day` home tree.
- confirmed clinic card triggers `clinic_day` home tree.
- partner link stores token hash only.
- partner view returns sanitized partner-visible cards only.

## Do not do in the group pass

- Do not implement #28 OpenRouter before manual P0 loop works.
- Do not persist LLM judgments.
- Do not make slide PNGs production UI.
- Do not combine all issues into one unverifiable mega-PR if avoidable.

## Readiness for grouped development

Before a grouped development run, provide the implementer/agent with:

1. `docs/01-product/prd-v1.0.md`
2. `docs/01-product/slc-target.md`
3. `docs/specs/issue-32-app-scaffold-vercel-supabase-foundation.md`
4. `docs/03-engineering/schema-rls-matrix.md`
5. `docs/02-design/deck.md`
6. GitHub issues #32–#35 and #23–#27

The stop condition for #32 remains scaffold verification, not SLC completion.
