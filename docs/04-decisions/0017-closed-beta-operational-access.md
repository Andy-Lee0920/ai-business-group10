# ADR 0017 — Closed beta operational access exception

## Status

Accepted — 2026-05-20

## Context

Closed beta = 10–30명 사용자. 운영 작업(디버깅, 고객 지원, seed posts 작성, moderation manual review)이 RLS isolation으로는 불가능. 한편 텅 빈 커뮤니티 feed는 첫 사용자 진입 마찰을 키운다 — 닉네임 노출 + persistent identity 환경에서 "내가 첫 사용자인가" 신호가 발생.

이 ADR은 `CLAUDE.md` 및 PRD invariant **"RLS isolates couple-scoped data"**의 **closed beta 한정 예외**를 명시한다.

## Decision

- **PG-A**: closed beta 동안 기존 Privacy Gate 1회 통과로 부부간 + 커뮤니티 작성 모두 허용. 별도 Community Gate 없음.
- **Admin full access**: closed beta 동안 service-role/admin이 `couple_journal_entries`, `community_posts`, `community_comments`, `community_post_empathies` 모두 read 가능. moderation review와 운영 지원을 위해 필요.
- **ES-B (seed posts)**: `Fevio 운영팀` 예약 `community_identity`로 운영팀이 작성한 sample posts를 closed beta bootstrap에 사용. `community_posts.is_official=true`로 UI에서 구별 표시.

## Rules

1. **Admin read scope**: closed beta 동안 service-role은 모든 couple-scoped row를 read할 수 있다. 단:
   - 모든 admin 접근은 audit log 기록 (누가, 언제, 어떤 row, 어떤 작업).
   - audit log 보존 = closed beta 전 기간 + 90일.
   - service-role 키는 클라이언트/브라우저-노출 코드에서 사용 금지 (server-only).
2. **Admin write scope**: admin은 moderation reject(`moderation_status='rejected'`), seed post 작성, audit-justified support 작업만 허용. hard delete 금지 (사용자 신뢰 손상, `deleted_at` soft delete만).
3. **사용자 고지**: closed beta onboarding 또는 약관에 "운영팀이 데이터에 접근할 수 있음, 신고/모더레이션/운영 지원 목적으로 한정, 모든 접근은 기록됨"을 명시. 별도 동의 step은 없음(PG-A) — 명시 carry-over만 한다.
4. **Privacy Gate carry-over**: 기존 Privacy Gate 한 번의 통과가 `couple_journal_entries` + `community_posts/comments/empathies` write 권한을 모두 부여. community 첫 진입 화면에 정책 안내(닉네임 노출 / 사진 검수 / 개인정보·병원명 노출 금지 / 모더레이션 검수 / 신고 가능)는 *문구로만* 표시한다.
5. **Seed posts**:
   - `community_identities`의 예약 row `Fevio 운영팀`이 author.
   - audience(`primary_feed`, `partner_feed`) 양쪽에 별도 작성.
   - `is_official=true`로 UI 배지 "운영팀 안내" 표시.
   - 사용자가 empathy/comment 가능. 운영팀이 comment에 응답 가능.
   - 작성 도구: closed beta 초기에는 Supabase 직접 insert. 사용자 증가 시 admin console (별도 작업).
6. **Transition out of closed beta**: 본 ADR은 closed beta 종료 시 자동 만료 후속 ADR 발급 필수:
   - PG-B 재도입 (Community Gate 별도 동의).
   - admin read scope를 support 요청 + audit-justified query로 좁힘.
   - seed posts 운명 결정 (유지/아카이브/삭제).

## Consequences

### Easier
- closed beta 운영 가능 (moderation manual review, 사용자 지원, seed posts 작성).
- 첫 사용자 진입 시 카테고리·톤 가이드 제공 (ES-B).
- 마찰 최소 (PG-A는 단일 gate).

### Harder
- admin 권한 확장 = lateral movement 위험 면적 확대. audit log + 인력 검증 필수.
- closed beta 종료 시 후속 ADR 발급 강제 — 잊으면 사용자 신뢰 침해.

### Prohibited
- service-role 키를 클라이언트 코드에 노출.
- audit log 없는 admin 접근.
- 본 ADR의 예외를 closed beta 종료 이후로 carry-over (후속 ADR 없이).
- admin이 사용자 row를 hard delete.
- AI/LLM이 admin moderation 결정을 대체.

## Follow-up criteria for revisiting

1. **Closed beta 종료** — 후속 ADR mandatory. 신규 user cohort 진입 전 필수.
2. **규제/관할 이벤트** — 즉시 RLS lockdown 필요 시 emergency 후속 ADR.
3. **사용자 신고가 admin access 그 자체를 문제 삼을 때** — 운영 정책 재검토.

## Related

- ADR 0015 — records tab entity model
- ADR 0016 — community identity & moderation (admin manual review 인력 의존)
- `CLAUDE.md` — "RLS isolates couple-scoped data" invariant (본 ADR은 이의 명명된 예외)
- `CONTEXT.md` — Privacy Gate, Official seed post
