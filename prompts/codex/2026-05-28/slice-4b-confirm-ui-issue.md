## Parent

TODOS.md TODO #2 — Confirmation UI: AI 원문 나란히 표시. 관련: #423

## What to build

Confirm UI 원문↔candidates 나란히 렌더링 슬라이스. #423의 데이터 계약과 도메인 함수를 소비해 사용자에게 원문 인용을 시각적으로 강제 노출한다.

기존 코드 사실:
- `app/split-review/page.tsx`와 `app/split-review/split-review-client.tsx` 존재. 현재 client는 candidate.sourceText만 렌더하고 raw_text 미노출.
- #423에서 추가된 `splitLines()` 반환 타입에 offset 포함, `mustInlineQuote()` 도메인 함수 사용 가능.

이 슬라이스에서:

1. **raw_text page→client 전달**: split-review page가 visit_inputs.raw_text를 client component props로 내려줌
2. **데스크톱(>=768px) 2-column 레이아웃**: 좌측 raw_text + 우측 candidate cards. raw_text는 candidate별 `source_offset_start/end` 범위에 highlight 마크 적용 (offset NULL이면 substring fallback + "approximated" 마커)
3. **모바일(<768px) 분기**:
   - `mustInlineQuote(candidate) === true` 카드: 카드 본문에 raw_text 인용 inline 노출 (토글 금지)
   - `mustInlineQuote(candidate) === false` 카드: "원문 보기" 토글로 bottom sheet 노출
4. **회귀 가드**: `mustInlineQuote()=true` 카드에서 인용 노출이 누락되면 unit test fail

## Acceptance criteria

- [ ] `app/split-review/page.tsx`에서 visit_inputs.raw_text를 server-side fetch 후 client component에 전달
- [ ] 데스크톱 2-column 레이아웃 + raw_text highlight (offset 기반 정확 또는 substring fallback)
- [ ] 모바일 비의무 카드: "원문 보기" 토글로 bottom sheet
- [ ] 모바일 의무 카드: 토글 없이 카드 본문에 raw_text 인용 inline
- [ ] offset NULL fallback 시 UI에 작은 "approximated" 마커 노출 (예: `≈` 아이콘)
- [ ] `npm run typecheck` 통과
- [ ] `npm test` 통과
- [ ] 단위 테스트: `mustInlineQuote()=true` candidate가 렌더된 트리에 인용 텍스트 포함되지 않으면 fail (jsdom assertion)
- [ ] e2e 테스트 데스크톱(viewport 1280x720):
  > "/split-review에서 raw_text와 candidate cards가 같은 화면에 보이고, 첫 candidate의 source_text가 raw_text에서 highlight되어 있다"
- [ ] e2e 테스트 모바일(viewport 360x720):
  > "/split-review에서 의무 카드(injection+my_action 또는 medication+my_action)의 raw_text 인용이 같은 viewport에 함께 보인다 (스크롤 없이)"
- [ ] e2e 테스트 모바일: 비의무 카드는 "원문 보기" 토글이 있고, 토글 안 누르면 raw_text 비노출
- [ ] confirm 액션 전에는 `care_action_cards`에 write가 없음을 검증 (Supabase test helper)

## URL-action-result

`/split-review`에서 사용자가 약품/주사 candidate 카드를 봤을 때 원문 인용이 같은 viewport에 함께 보여 (스크롤 없이) AI 분류가 원문의 어느 문장에서 나왔는지 즉시 확인할 수 있다.

## Anti-patterns (reject)

- `visit_inputs.raw_text` 전체를 partner projection에 전달 (sanitize 의무)
- `isDemoMode`로 raw_text source를 분기 (도메인 함수는 단일 contract)
- `card_type` 또는 `safety_level`을 클라이언트에서 결정 (서버 결정만 신뢰)
- `Record<string, unknown>`으로 candidate offset 우회
- `mustInlineQuote` 규칙을 컴포넌트 안에 인라인 (도메인 함수 재호출)

## STOP conditions

- #423(Slice 4a)이 Red 상태(offset 컬럼·도메인 함수 미적용)면 stop
- visit_inputs 스키마에서 page→client 직접 전달이 RLS 영향이 크면 stop하고 schema-rls-matrix 업데이트 child issue 분리

## Blocked by

- #423 (Slice 4a — source_offset 컬럼 + `mustInlineQuote` 도메인 함수)
