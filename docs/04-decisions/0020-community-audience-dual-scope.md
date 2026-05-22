# ADR 0020 — Community audience dual-scope (everyone + same_role)

## Status

Accepted — 2026-05-20

## Context

ADR 0015 와 0016 은 `community_posts.audience` 를 role-segmented enum (`primary_feed` | `partner_feed`) 으로 정의. 같은 role 끼리만 read/write — IVF 정서 비대칭 (당사자 ↔ 파트너) 보호, sybil 방어, closed beta moderation 단순화가 근거.

Product 재검토 (2026-05-20): 사용자가 expect 하는 커뮤니티 경험은 *자유게시판/SNS feed*. 현재 role-segmented only 모델 + form 패턴 UI 가 결합되어:

- 분절된 두 게시판 = "묶여 있는 폼" 인상.
- 당사자/파트너 사이의 cross-role 발화 surface 가 product 전체에 부재.
- closed beta 의 작은 cohort 에서 두 feed 가 분리되면 각 feed 가 더 비어 보임.

단 audience 를 *완전* 전면 공개 단일 scope 로 바꾸면 IVF 정서 비대칭 보호가 무너짐. 당사자가 파트너의 시선을 의식해 자기검열 발생.

따라서 본 ADR 은 audience scope 자체를 dual 로 확장하고, default 와 자동 채움 규칙으로 마찰을 최소화한다.

## Options compared

| Option | Shape | Risk |
|---|---|---|
| A. role-segmented only (ADR 0015 그대로) | `primary_feed`/`partner_feed` 만 | 자유게시판 정체성 약함. UI 리디자인만으로 부분 완화 가능, schema 변경 없음. |
| B. all-everyone (단일 통합) | 한 scope 만 (`everyone`) | 정서 비대칭 보호 손실. 당사자 글에 파트너가 댓글 → 자기검열. |
| C. dual-scope, default `everyone` | 작성자가 글 단위 선택, default 모두 공개 | Schema 변경 + RLS 분기. 안전 옵션 보존 + SNS 정체성 확보. |
| D. dual-scope, default `same_role` | 작성자가 글 단위 선택, 안전 default | 매번 "모두에게" 로 바꿔야 함 → 자유게시판 정체성 다시 약화. |

## Decision

**Option C** — `community_posts.audience_scope ∈ {everyone, same_role}` 둘 중 작성자가 선택. UI default = `everyone`.

추가 lock-in:

- `same_role` 선택 시 audience role 은 작성자의 `couple_members.role` 로 *자동* 결정 (사용자가 별도 선택하지 않음 → UI 마찰 최소).
- 통합 단일 피드 표시. 카드에 "모두에게" / "같은 롤만" 텍스트 배지로 구분.
- Community UI 자체를 form 패턴 → SNS feed 패턴으로 전면 리디자인 (별도 implementation 작업; 본 ADR 은 데이터/권한 결정만 lock-in).

본 ADR 은 ADR 0015 의 audience enum 정의 (AUD-B 의 role-segmented only 부분) 를 확장 supersede 한다. 사진 비대칭 (커뮤니티 photo 없음) 및 의료 필드 차단 등 ADR 0015 의 다른 lock-in 은 그대로 유지.

## Rules

1. **Schema** — `community_posts` 컬럼 재구성:
   - `audience_scope text not null check (audience_scope in ('everyone','same_role'))`
   - `audience_role text null check (audience_role is null or audience_role in ('primary','partner'))`
   - 무결성 제약: `audience_scope='same_role'` → `audience_role is not null`; `audience_scope='everyone'` → `audience_role is null`.
2. **Audience role auto-fill**: `audience_scope='same_role'` 인 INSERT 는 server-side 에서 actor 의 `couple_members.role` 로 `audience_role` 자동 채움. 클라이언트가 임의 role 지정 불가 (INSERT trigger 또는 API layer 정규화).
3. **RLS read 정책**:
   - `audience_scope='everyone'` + `moderation_status='approved'` → 모든 인증 사용자 read.
   - `audience_scope='same_role'` + `moderation_status='approved'` → actor 의 `couple_members.role` = post 의 `audience_role` 일 때만 read.
   - 작성자 본인 (그리고 같은 couple 의 동일 role 멤버) 은 `moderation_status` 무관하게 자기 글 read (기존 정책 유지).
4. **Comments / empathies**: comment / empathy 의 read·write 권한은 post 의 read 권한에 종속. `everyone` 글에는 cross-role comment/empathy 가능. `same_role` 글에는 동일 role 만 가능.
5. **Migration**: 기존 `audience('primary_feed' | 'partner_feed')` enum 데이터:
   - `primary_feed` → `audience_scope='same_role'`, `audience_role='primary'`
   - `partner_feed` → `audience_scope='same_role'`, `audience_role='partner'`
   - 기존 데이터에 `everyone` 글은 존재하지 않음 (new path; closed beta).
   - 기존 enum 컬럼은 application 코드 갱신 후 별도 migration 으로 drop (rolling 호환).
6. **Default UI**: compose sheet 의 audience selector default = `everyone`. 사용자가 "같은 롤만 보기" 로 *적극 선택* 해야 same_role 로 전환. selector 옆 helper text 로 "같은 롤만 = 같은 입장의 사용자에게만 보입니다" 명시.
7. **Badge 표시**: 통합 피드 카드에 텍스트 배지 — `everyone` 글: "모두에게" / `same_role` 글: "같은 롤만". 작성자의 role 자체는 노출하지 않음 (community identity nickname 보호).
8. **Moderation 파이프라인** (ADR 0016): keyword filter + admin manual review + 사용자 신고는 두 scope 에 동일하게 적용. `everyone` 글의 noise 증가에 대비 keyword filter rule 갱신은 운영 책임.

## Consequences

### Easier

- SNS 자유게시판 정체성 확보 (default `everyone`).
- IVF 정서 비대칭 보호 옵션 유지 (`same_role` 선택지).
- 통합 단일 피드 = closed beta 의 작은 cohort 에서도 feed 가 비어 보이지 않음.
- ADR 0016 의 moderation 파이프라인 (filter + manual review + reports) 그대로 적용.
- ADR 0017 의 official seed posts (`is_official=true`) 도 `everyone` scope 으로 운영 가능 — 양 role 모두에게 한 번에 노출.

### Harder

- Schema 변경 + 기존 enum 데이터 migration + RLS read 정책 분기.
- Moderation 인력 부담 — `everyone` 글이 noise 가 될 가능성 (closed beta 운영팀이 monitor + filter rule 갱신).
- 사용자가 default `everyone` 으로 민감 글 실수 노출할 위험 → compose UI 에 명확한 audience 표시 + 작성 직전 confirm 디테일 필요.
- 통합 피드의 정렬/필터 정책 (`created_at DESC` 유지) 이 두 scope 혼재 환경에서 사용자 인지 부담을 키울 수 있음 — UI 배지로 보완.

### Prohibited

- `everyone` / `same_role` 외 별도 audience 옵션 추가 (e.g., "특정 동료에게만"). 본 ADR 의 범위는 두 scope.
- `audience_role` 을 사용자가 직접 임의 지정 (server-side 자동 채움만).
- `same_role` 글을 cross-role 사용자에게 노출 (RLS 우회).
- AI/LLM 이 audience scope 결정에 개입 — CLAUDE.md AI advisory invariant 그대로.
- `audience_scope` 를 사후 변경 (작성 후 scope 수정 API 미제공) — 잘못 노출된 글은 작성자 본인이 삭제 후 재작성.

## Follow-up criteria for revisiting

1. `everyone` vs `same_role` 작성 비율이 측정되어 한쪽 scope 이 거의 사용되지 않을 때.
2. 사용자 group 모델 확장 (couple 외 다인 group) 으로 scope 모델 자체가 바뀔 때.
3. 모더레이션 부담이 closed beta admin 인력 capacity 를 넘을 때.
4. 사용자 신고/지원 요청에서 "잘못된 audience 노출" 사례가 측정 가능한 수준으로 누적될 때 (compose UI confirm 강화 또는 default 변경 검토).

## Related

- ADR 0015 — records tab entity model (audience enum 정의를 본 ADR 이 확장 supersede)
- ADR 0016 — community identity & moderation (moderation 파이프라인 그대로 적용)
- ADR 0017 — closed beta operational access (admin manual review 인력 의존, seed posts 운영)
- ADR 0019 — couple journal partner-link gate (동일 grilling 세션 산출)
- `CONTEXT.md` — Community post (audience scope 정의 갱신됨)
