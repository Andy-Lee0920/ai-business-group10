# ADR 0019 — Couple Journal partner-link activation gate

## Status

Accepted — 2026-05-20

## Context

ADR 0017 의 PG-A 는 "Privacy Gate 한 번 통과로 `couple_journal_entries` + `community_posts` write 모두 허용" 으로 명시. 즉 couple shell 생성 직후부터 primary user 가 journal entry 를 즉시 작성할 수 있는 모델.

Product 재검토 (2026-05-20): Couple Journal 의 정체성은 "부부간 = 둘만 보기" 의 *shared* private space. 파트너 미연결 상태에서 entry 가 누적되면:

- partner 가 read 할 수 없는 entry 가 쌓임 → "shared" 정체성이 실제로는 "private diary" 로 collapse.
- 사용자 expectation 모호: 이 글은 *나중에* 파트너가 보는 것인가, *지금* 나만 보는 것인가.
- 파트너 연결 자체가 product activation 의 핵심 동선인데, journal 이 미연결 상태에서도 활성이면 partner invite 동기가 약해짐.

기록 탭 자체가 두 sub-surface (Couple Journal / Community 자유게시판) 로 분리되면서, journal 을 partner-link 게이트 surface 로 사용하는 것이 자연스러워짐.

## Options compared

| Option | Shape | Risk |
|---|---|---|
| A. Journal write 가능 from couple shell creation (현 ADR 0017 PG-A) | 미연결 상태에서도 entry 작성 허용 | "둘만 보기" 정체성 약화. partner activation 동기 약함. |
| B. Journal write requires `partner_links.status='approved'` | 파트너 승인 후에만 활성 | 첫 사용자 진입 시 journal 탭 비활성 → 기록 탭 placeholder + 초대 CTA 로 완화. |
| C. Journal entries 허용하되 partner-visible 필드만 NULL/locked | 데이터 dual-state, RLS 분기 ↑ | 본질적으로 A 와 동일한 마찰 + 복잡도. |

## Decision

**Option B** — Couple Journal write 는 `partner_links.status='approved'` 를 선결 조건으로 요구한다.

추가 lock-in:

- Records tab 진입은 항상 허용. [커플저널] sub-tab 은 visible 하되 잠금 placeholder + "파트너 초대하기" CTA.
- 파트너 승인 직후 첫 진입 시 compose sheet 자동 펼침 + "둘만의 첫 기록을 남겨보세요" empty state.
- Community write 는 본 ADR 영향 없음 — Privacy Gate 만으로 충분 (ADR 0017 PG-A 의 community 부분 유지).

본 ADR 은 ADR 0017 PG-A 의 journal 부분 진술을 부분 supersede 한다.

## Rules

1. **Gate check (server)**: `couple_journal_entries` INSERT 시 server-side 에서 actor 의 couple 에 `partner_links.status='approved'` row 존재 검증. 없으면 `403 partner_link_required`. POST `/api/records/journal` 에 이 검증을 명시적으로 추가.
2. **RLS INSERT 정책**: 기존 couple-scoped INSERT 조건에 partner_link approved 검사 함수 추가. SELECT / UPDATE / DELETE 는 변경 없음 (이미 작성된 entry 는 partner 승인 이후에도 read/edit/soft-delete 가능; partner 가 unlink/reject 후에도 historical read 가능).
3. **UI 잠금**: Records tab 내 [커플저널] sub-tab 항상 visible. 파트너 미연결 시:
   - compose 영역 비활성 (탭 시도 시 placeholder 로 redirect).
   - empty state: 짧은 안내 카피 + primary CTA "파트너 초대하기" → `/more#partner-invite`.
4. **재활성화 흐름**: placeholder CTA → `/more#partner-invite` → 초대 링크 생성/공유 → 파트너 승인 → Records tab 복귀 시 compose 활성. 별도 reload trigger 불요 (재진입 시 partner_link 상태 재조회).
5. **Photo upload**: `couple-journal-photos` 버킷 RLS 는 그대로 (`can_create_sensitive_rows` 가드 이미 존재). 사진 첨부도 partner-link gate 통과 후에만 가능 — application layer + DB INSERT 시 동일 게이트 적용.
6. **Partner unlink 후 historical 데이터**: 파트너가 unlink 또는 revoke 했을 때 기존 entry 는 삭제하지 않음 (`deleted_at` soft-delete 와 별개). 잠금 placeholder 가 다시 표시되며 신규 write 차단. 기존 entry 의 read 권한은 보존.

## Consequences

### Easier

- "부부간 = 둘 다 있어야 의미 있는 공간" 정체성이 schema + UX 양쪽에서 명확.
- 파트너 초대 동선이 기록 탭에서 자연스럽게 발생 — Records tab 이 partner activation surface 역할.
- RLS 단일 조건 (partner_link approved) 추가, 복잡도 작음.
- ADR 0017 의 closed beta 정책과 모순 없음 (Privacy Gate 는 여전히 single gate, journal 만 추가 게이트).

### Harder

- 첫 사용자가 기록 탭 진입 시 즉시 사용 가능한 surface 가 [커뮤니티] 한 탭으로 축소.
- Partner 가 unlink 또는 revoke 한 경우 잠금 placeholder 로 회귀하는 UX 추가 필요.
- POST `/api/records/journal` 의 현재 구현 (`actor.couple_id` 만 검사) 에 partner_link 검사 추가 필요 → 회귀 테스트 필수.

### Prohibited

- 파트너 미연결 상태에서의 journal write 허용 (UI 우회 / 직접 API 호출 모두 차단).
- "fallback 으로 일단 entry 만들고 나중에 partner 보이게" 같은 데이터 dual-state.
- `partner_links.status='pending'` 또는 `'rejected'` 를 `approved` 와 동등 취급.
- partner unlink 후 historical entry 의 hard-delete (`deleted_at` 도 사용자 명시 액션에만).

## Follow-up criteria for revisiting

1. Single-user mode (파트너 없는 사용 시나리오) 가 product roadmap 에 진입할 때 — gate 자체를 단계적으로 옵션화하는 후속 ADR 필요.
2. Couple shell 이 다인 (2명 이상) group 으로 확장될 때.
3. 잠금 placeholder 가 사용자 retention/initiation 에 *부정적* 영향이라는 측정 데이터가 나올 때.

## Related

- ADR 0015 — records tab entity model (Couple Journal entity 정의)
- ADR 0017 — closed beta operational access (PG-A 의 journal 부분을 본 ADR 이 부분 supersede)
- ADR 0020 — community audience dual-scope (동일 grilling 세션 산출)
- `CONTEXT.md` — Couple journal entry, Privacy Gate
