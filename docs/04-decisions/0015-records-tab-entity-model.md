# ADR 0015 — Records tab entity model: couple journal + community split

## Status

Accepted — 2026-05-20

## Context

Records tab originally tracked billing/cost (receipts, government subsidy, cost line chart). Product pivot: 비용 추적기 폐기, 부부간 정서 기록(둘만 보기)과 role-segmented 커뮤니티(공감 나누기)로 재구성. 두 surface는 sensitivity 경계와 작성자 모델이 다르므로 stable data model을 UI rewrite 이전에 결정해야 한다.

## Options compared

| Option | Shape | Risk |
|---|---|---|
| A. 단일 entity + `scope: 'couple' \| 'community'` toggle | 한 entry를 toggle로 노출 범위 결정 | 사용자가 toggle 실수 = 의료 정서가 외부 노출. 익명 환경에서 회수 불가. |
| B. 두 별도 entity | `couple_journal_entries` + `community_posts` 분리 | RLS·sanitization·작성 폼이 두 contract. 마찰 있지만 안전 경계 명확. |

## Decision

**Option B** — 두 entity 분리. 추가 lock-in:

- 부부간 entry는 `care_action_cards`와 FK 없음 (K2). activity 분류는 홈/달력 책임.
- audience는 role-based (`primary_feed` / `partner_feed`). UI label "여자들/남자들"은 closed beta hetero 가정의 표시일 뿐 schema 값과 분리 (AUD-B).
- 부부간 entry는 primary·partner 양쪽 작성 (P3). partner 작성 시 의료 필드 NULL 강제.
- 공유 기록은 카드형 피드로 전환한다. `community_posts.photo_urls` 는 허용하되, 병원 안내문 원본·개인정보·병원명이 보이는 이미지는 UI copy와 moderation에서 금지한다.

## Rules

1. **`couple_journal_entries`**: couple-scoped RLS. 필드 `body`(text), `mood`(enum), `pain_score`(0–10, `author_role='partner'`일 때 NULL 강제), `photo_urls`, `author_role`, `author_id`, `couple_id`, `created_at`, `updated_at`, `deleted_at`.
2. **`community_posts`**: audience-locked RLS — actor의 `couple_members.role` = post의 `audience`만 read/write. 필드 `body`, `mood`, `sub_category`, `photo_urls`, `community_identity_id`, `audience('primary_feed' \| 'partner_feed')`, `moderation_status`, `is_official`, `deleted_at`, `created_at`.
3. **K2**: `couple_journal_entries`에 `care_action_card_id` FK 금지. 약/주사 언급은 자유 텍스트로만.
4. **사진 경계**: `couple_journal_entries.photo_urls` 는 부부 전용 사진이고, `community_posts.photo_urls` 는 공유 기록 카드 사진이다. 커뮤니티 사진은 짧은 캡션과 함께 공개 검수 대상이며, raw clinic document / 개인정보 / 병원명 노출은 금지한다.
5. **Partner 의료 필드 차단**: partner author entry에서 `pain_score`/`medication_id` 등 의료성 컬럼은 insert trigger 또는 check constraint로 NULL 강제.
6. **삭제 권한 (DR-A)**: 부부간 entry는 작성자 + 같은 부부 partner 둘 다 삭제 가능 (couple 공동 소유). community는 작성자 본인만 삭제. admin은 moderation reject(hide), hard delete 안 함.
7. **정렬 (SORT-C)**: 부부간은 `created_at DESC` + 클라이언트 날짜 그룹(오늘/어제/이번주/이전). community는 `created_at DESC` + `sub_category` 탭 필터. `empathy_count` 기반 hot ranking 금지.
8. **soft delete**: hard delete 대신 `deleted_at` timestamp. 신고 추적·audit 회수를 위해 row 보존.

## Consequences

### Easier
- 두 surface의 privacy/RLS 경계가 독립.
- label "여자들/남자들" 변경(예: hetero 가정 제거)은 UI-only.
- 부부간 사진 정책과 커뮤니티 사진 미적용이 RLS 경계와 1:1 정합.

### Harder
- 두 write path, 두 RLS contract, 두 storage 정책.
- 새 테이블 = migration·인덱스·테스트 surface 증가.

### Prohibited
- 한 entity에 `scope` toggle을 두어 부부간/커뮤니티를 분기하지 않는다.
- `couple_journal_entries`에서 `care_action_card_id` FK를 갖지 않는다.
- `community_posts.photo_urls` 를 raw clinic document 저장소처럼 쓰지 않는다.
- partner author entry가 의료 필드를 채우지 않는다.

## Follow-up criteria for revisiting

1. 세 번째 surface가 같은 `body+mood` schema를 필요로 할 때 (드물 것).
2. 사용자 확장으로 audience label/분기 키 자체가 hetero 가정에서 벗어나야 할 때 — schema 값은 변경 없이 label만 새 ADR로 갱신.

## Related

- ADR 0013 — confirm spine canonical (`care_action_cards` 정체성)
- ADR 0014 — deterministic mapping pattern (data-driven rules 철학 공유)
- ADR 0016 — community identity & moderation
- ADR 0017 — closed beta operational access
- `CONTEXT.md` — 신규 domain terms (Couple journal entry, Community post)
