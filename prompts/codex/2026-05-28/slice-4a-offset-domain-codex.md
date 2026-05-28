# Codex — Slice 4a (#423) split_candidates offset + mustInlineQuote

## Mission
Issue #423 acceptance 전건 Green + PR. char offset 컬럼 + `splitLines` 위치 보존 + `mustInlineQuote` 도메인 함수 + ADR 0029.

## 필독
- `slice-4a-offset-domain-issue.md`, `README.md` (같은 폴더)
- `gh issue view 423 --comments`
- `CLAUDE.md`, `TODOS.md`(TODO #2), `CONTEXT.md`, ADR `0013`, `docs/specs/spec-capture-action-split.md`
- 코드: `src/domain/{line-split,clinic-memo-parser,care-cards}.ts`, `src/types/care-cards.types.ts`, `supabase/migrations/202605100003_capture_confirm.sql`, `app/api/{capture,onboard/photo-analyze,onboard/text-analyze}/route.ts`

## Goal
`POST /api/capture` 직후 생성된 모든 신규 `split_candidates` row가 `source_offset_start/end` 값을 갖고, `raw.slice(start,end) === source_text`.

## Branch & PR
- `feat/423-offset-domain`, title `feat(confirm): #423 offset + mustInlineQuote`

## Steps (README 공통 반복: 3-strike STOP / Green 재편집 금지)
1. **Migration**: `supabase/migrations/{date}_split_candidates_source_offset.sql` — `add column source_offset_start int null, source_offset_end int null`. RLS 무변경. comment(NULL=legacy). `feat(schema): split_candidates source offset`
2. **splitLines 타입 확장**: 반환 `string[]` → `Array<{text,offsetStart,offsetEnd}>`. 내부 누적 offset 추적. `npm run typecheck`로 콜러 Red 목록 확보. `refactor(line-split): offset return type`
3. **콜러 업데이트**: 전수 업데이트(단순 `.map(x=>x.text)` 또는 어댑터). typecheck exit 0. STOP CONDITION: 콜러 30곳 초과 → blocker-note. `refactor(line-split): update callers`
4. **API offset 저장**: capture/photo-analyze/text-analyze route 각 candidate insert 시 offset 포함. 통합 테스트(`tests/integration/split-candidate-offset.test.ts`) raw_text round-trip 일치. `feat(capture): persist offset`
5. **mustInlineQuote 도메인**: `src/domain/care-cards.ts`에 `mustInlineQuote(c: Pick<SplitCandidate,'suggestedCardType'|'assignedTo'>): boolean`. 규칙: `suggestedCardType ∈ ('injection','medication') && assignedTo==='my_action'`. unit 5 fixture(injection-my T/medication-my T/injection-partner F/clinic_visit-my F/excluded F). `feat(domain): mustInlineQuote`
6. **offset 5 fixture**: 단문/장문 줄바꿈/빈줄/중복문/이모지+한글. 각 case `raw.slice(start,end)===text`. STOP: multibyte 처리 실패 → blocker-note(codepoint 정책 child issue). `test(line-split): offset 5 fixtures`
7. **ADR 0029** `docs/04-decisions/0029-confirm-ui-mandatory-inline-quote-rule.md` (Accepted 2026-05-28). 5 옵션(suggestedCardType only/+assignedTo/user_marked/all/no toggle) + Decision=+assignedTo + Prohibited. `docs(adr): 0029`
8. **DOD**: typecheck+test(전체 회귀) exit 0
9. **PR**: push, gh pr create. body=schema diff+콜러 목록+ADR. Issue #423 comment.

## DOD
- migration(RLS 무변경), splitLines 타입+콜러 전수, mustInlineQuote 5 fixture, offset 5 fixture, capture round-trip 통합, ADR 0029, typecheck/test exit 0, PR + Issue #423 comment

## 금지
- `Record<string, unknown>`/`any`로 offset 우회, 도메인에 demo/onboarding flag 분기, offset NOT NULL 강제, `mustInlineQuote`를 클라이언트에서 결정, README 공통(`@ts-ignore`/skip/amend/no-verify/close)

## STOP
- 콜러 30곳 초과 → caller migration child
- multibyte 한글 offset 실패 → codepoint 정책 child
- 기존 row 매칭 불가 → backfill 재검토 child
