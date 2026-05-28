# Codex — Slice 4b (#425) Confirm UI side-by-side

## Mission
Issue #425 acceptance 전건 Green + PR. `/split-review`에 raw_text↔candidates 나란히 + `mustInlineQuote` 의무 카드 모바일 inline 강제.

## 필독
- `slice-4b-confirm-ui-issue.md`, `README.md` (같은 폴더)
- `gh issue view 425|423 --comments`
- `CLAUDE.md`, `TODOS.md`(TODO #2), `CONTEXT.md`, ADR `0013`·`0029`
- 코드: `app/split-review/{page,split-review-client}.tsx`, `src/domain/{care-cards,line-split}.ts`, `tests/unit/slc-confirm-sheet-render.test.ts`, `tests/e2e/capture-confirm.spec.ts`

## Goal
`/split-review`에서 약품/주사 candidate 카드를 봤을 때 원문 인용이 같은 viewport에 함께 노출(스크롤 없이).

## Branch & PR
- `feat/425-confirm-ui`, title `feat(confirm): #425 side-by-side`

## Steps (README 공통 반복 규약)
0. **Precondition**: #423 머지 + `grep -r mustInlineQuote src/domain/` + offset 컬럼 존재 확인. 미충족 → STOP+blocker-note.
1. **Page → client raw_text**: `page.tsx`에서 candidate.visit_input_id로 `visit_inputs.raw_text` server join(RLS). client props `rawText: string`. typecheck + 통합. `feat(split-review): pass raw_text to client`
2. **데스크톱 2-column**: `>=768px` CSS grid 좌raw+우candidates. candidate별 offset 범위 `<mark>` highlight. offset NULL → `rawText.indexOf(source_text)` fallback + `≈` 마커. jsdom unit. `feat(split-review): desktop 2-column highlight`
3. **모바일 분기**: `<768px`에서 `mustInlineQuote(c)===true` → 카드 본문 source_text inline(토글 금지). false → "원문 보기" 토글 → bottom sheet. jsdom unit(360px+토글). `feat(split-review): mobile inline-vs-toggle`
4. **NULL fallback 마커**: offset NULL+indexOf 성공 → highlight+`≈`. indexOf -1 → text만+`≈`. unit 2 case. `feat(split-review): NULL fallback marker`
5. **회귀 가드**: `tests/unit/confirm-mandatory-quote-render.test.tsx` 5 fixture(injection-my/medication-my/injection-partner/clinic_visit-my/excluded). 의무 카드에 source_text 미포함 → fail. 비의무 카드가 토글 미클릭 시 source_text 노출 → fail. `test: mandatory quote regression`
6. **e2e 데스크톱**: `tests/e2e/split-review-desktop-side-by-side.spec.ts` 1280x720, raw+candidate 동시 + 첫 highlight. `test(e2e): desktop`
7. **e2e 모바일**: `tests/e2e/split-review-mobile-mandatory-quote.spec.ts` 360x720, 의무 카드(injection+my_action seed) source_text 같은 viewport(no scroll). 비의무 토글 미클릭 시 source_text 비노출. `test(e2e): mobile mandatory`
8. **Confirm 무영향**: 통합 — `/split-review` 렌더만 시 `care_action_cards` write 없음(Supabase helper). `test(integration): no persist before confirm`
9. **DOD**: typecheck+test+e2e exit 0
10. **PR**: push, gh pr create, body에 모바일+데스크톱 스크린샷, Issue #425 comment

## DOD
- page→client raw_text, 데스크톱 2-column highlight, 모바일 의무 inline+비의무 토글, NULL fallback `≈`, unit 5 fixture, e2e desktop+mobile, confirm 전 write 없음, typecheck/test/e2e exit 0, PR + Issue #425 comment + 스크린샷

## 금지
- raw_text를 partner projection 전달, `isDemoMode`로 source 분기, `card_type`/`safety_level`을 클라이언트에서 결정, `Record<string, unknown>`로 offset 우회, `mustInlineQuote` 컴포넌트 인라인, README 공통

## STOP
- #423 미머지 → blocker-note
- raw_text 전달이 RLS 영향 큼 → schema-rls-matrix child
- 모바일 360px 인용 공간 부족 → UX child(HITL)
