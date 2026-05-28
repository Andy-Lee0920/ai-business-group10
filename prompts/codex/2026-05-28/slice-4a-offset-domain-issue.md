## Parent

TODOS.md TODO #2 — Confirmation UI: AI 원문 나란히 표시

## What to build

Confirm UI 원문↔candidates 나란히 표시의 **데이터 계약 + 도메인 함수** 슬라이스. UI 변경은 별도 슬라이스(4b).

기존 코드 사실:
- `visit_inputs.raw_text` (canonical 원문, ADR 0013)
- `split_candidates[]` (canonical candidates, 각 candidate는 `source_text` line fragment 보유)
- `split_candidates`에 raw_text 내 위치(char offset) 정보 없음
- `DisplaySafetyLevel` enum = `'normal' | 'time_sensitive' | 'critical'` (`'HIGH'` 없음)
- `computeDisplaySafetyLevel`은 confirmed `CareActionCard`만 입력 — candidate 단계에서 호출 불가
- `ai_translation_drafts` 테이블은 **존재하지 않음** — 본 슬라이스 범위 외 (P1 LLM 통합 시 별도 ADR)

이 슬라이스에서 추가:

1. **char offset 컬럼**: `split_candidates`에 `source_offset_start int null`, `source_offset_end int null` 추가
2. **parser 위치 보존**: `splitLines()` 반환 타입 `string[]` → `Array<{ text: string; offsetStart: number; offsetEnd: number }>`
3. **mustInlineQuote 도메인 함수**: `suggestedCardType ∈ ('injection','medication') AND assignedTo === 'my_action'` → true
4. **Backfill 정책**: NULL 허용. 기존 row는 그대로, 신규 row만 채움. UI fallback은 4b에서 처리.

## Acceptance criteria

- [ ] supabase/migrations 신규 파일: `split_candidates`에 `source_offset_start int null`, `source_offset_end int null` 추가 (RLS 변경 없음)
- [ ] `src/domain/line-split.ts`의 `splitLines()` 반환 타입 변경: `string[]` → `Array<{ text: string; offsetStart: number; offsetEnd: number }>`
- [ ] 기존 `splitLines` 콜러 전수 업데이트 (grep으로 식별, 모두 컴파일 통과)
- [ ] split_candidates 작성 경로(예: `POST /api/capture`, `POST /api/onboard/photo-analyze`, `POST /api/onboard/text-analyze`)에서 offset 저장 — audit으로 실제 경로 확인 후 적용
- [ ] 신규 도메인 함수 `mustInlineQuote(candidate: SplitCandidate): boolean` 추가. 위치: `src/domain/care-cards.ts` 또는 신규 `src/domain/confirm-ui-policy.ts`
- [ ] 단위 테스트: `splitLines` offset 보존 fixture 5종 (단문/장문/줄바꿈/중복문/이모지)
- [ ] 단위 테스트: `mustInlineQuote` fixture 5종:
  - injection + my_action → true
  - medication + my_action → true
  - injection + partner_action → false
  - clinic_visit + my_action → false
  - excluded → false
- [ ] ADR 0029 (`docs/04-decisions/0029-confirm-ui-mandatory-inline-quote-rule.md`) 작성: 5개 옵션 비교 + 결정 + 근거
- [ ] `npm run typecheck` 통과
- [ ] `npm test` 통과 (split·parser·confirm 관련 테스트 전부 포함)
- [ ] 기존 통합/e2e 테스트 회귀 없음

## URL-action-result

`POST /api/capture`에 raw_text를 보낸 직후 생성된 `split_candidates` row들이 모두 `source_offset_start/end` 값을 갖고, 그 offset 범위로 raw_text를 slice하면 candidate의 `source_text`와 일치한다 (모든 신규 row).

## Anti-patterns (reject)

- `Record<string, unknown>` 또는 `any`로 offset 우회
- 도메인 함수에 demo/onboarding flag 분기 (parser는 단일 contract)
- offset 컬럼을 NOT NULL로 강제 (backfill 정책 위배)
- `mustInlineQuote` 규칙을 클라이언트에서 결정 (도메인 함수만 신뢰)

## STOP conditions

- `splitLines` 콜러가 30곳 이상이면 stop하고 caller migration 별도 issue로 분리
- offset 계산이 multi-byte 한글 처리에서 실패하면 stop하고 string vs codepoint 정책 결정 child issue 분리

## Blocked by

None - can start immediately (parallel with Slice 1, 2)
