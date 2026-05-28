# ADR 0016 — Community identity & moderation policy

## Status

Accepted — 2026-05-20

## Context

커뮤니티(공감 나누기)는 다른 부부의 사용자에게 노출되는 surface. identity 모델과 moderation 정책이 사용자 신뢰와 closed beta 안전성을 결정한다.

PRD/CLAUDE.md invariant: "AI assistance is advisory only, may not decide medical judgment". 모더레이션 정책은 이 경계를 침해할 수 없다.

## Options compared

**Identity:**
| Option | 표시명 | Risk |
|---|---|---|
| ID-A | 실명 | IVF 시술 + 실명 노출 = 동료·가족이 시술 사실 인지. closed beta 트러스트 손실. |
| ID-B | 사용자 지정 nickname (영구) | 마찰: 닉네임 짓기. 통제력은 강함. |
| ID-C | 자동 추천 nickname (사용자 수정 가능, 변경 빈도 제한) — hybrid | 마찰 최소 + 통제 보존. |
| ID-D | 매 글 randomized handle | 본인 글 회수 불가. 발자취·empathy·comment 단절. |

**Moderation:**
| Option | 사전 | 사후 |
|---|---|---|
| M1 | 없음 | 신고 → admin |
| M2 | deterministic keyword filter | 신고 |
| M3 | admin manual review | — |
| M-Hybrid | deterministic filter + admin manual review | 사용자 신고 |

**Interaction:**
| Option | 인터랙션 |
|---|---|
| COM-A | empathy only |
| COM-B | empathy + 1단 comment |
| COM-C | empathy + 다단 comment |

## Decision

- **Identity: ID-C hybrid** — 자동 추천 nickname + 사용자 직접 수정 가능 + 변경 빈도 제한.
- **Moderation: M-Hybrid** — deterministic keyword filter + admin manual review + 사용자 신고.
- **Interaction: COM-C** — empathy + 다단 comment.

## Rules

1. **`community_identities`** 테이블: `(user_id 또는 couple_id+role, nickname, created_at, last_changed_at)`. `nickname` UNIQUE.
2. **예약 nickname**: `Fevio 운영팀` 등 운영용 식별자는 사용자 claim 금지.
3. **Nickname 변경 빈도**: closed beta 기본 30일 1회 (정확한 값은 micro-decision).
4. **Randomized handle 금지**. 동일 사용자의 nickname은 모든 글·comment에서 일관.
5. **`moderation_status` enum**: `pending | approved | rejected`. 다른 사용자에게는 `approved`만 노출. `pending`/`rejected`는 작성자 본인 view에서 status 표시.
6. **Deterministic filter**: 약물명·복용량 표현·의료 권유 어휘는 insert 시 자동 match. match 시 `moderation_status='pending'` + admin review 큐로 진입. filter rule set은 Supabase 테이블로 관리 (코드 deploy 없이 갱신).
7. **Admin manual review** (closed beta): admin이 pending 글을 approve/reject. reject은 사유 코드 enum + 사용자에게 표시 가능한 카피.
8. **사용자 신고**: `community_reports(reporter_identity_id, target_type, target_id, reason enum, created_at, resolved_status)`. 자기 자신 신고 금지. 같은 reporter가 같은 target에 중복 신고 금지 (UNIQUE constraint).
9. **Comment**: `community_comments` 테이블, `parent_comment_id` self-FK로 thread 표현. post와 동일 moderation 파이프라인 통과.
10. **Empathy**: `community_post_empathies(post_id, actor_couple_id, actor_role, created_at)`, UNIQUE `(post_id, actor_couple_id, actor_role)`. `empathy_count`는 derived view, stored 컬럼 아님.

## Consequences

### Easier
- 사용자 발자취 회수 (본인 글·comment·empathy 모두 단일 identity로 묶임).
- AI invariant 보호 (LLM이 moderation decision을 내리지 않음).
- filter rule을 운영 중 갱신 가능 (data-driven).

### Harder
- closed beta admin 인력의 manual review cycle 필요.
- Comment thread = moderation surface 2배.

### Prohibited
- AI/LLM이 moderation 게시·차단 결정을 내리는 것.
- 매 글마다 다른 randomized author handle.
- 실명을 기본 author 표시로 사용.
- Nickname 빈번 변경(빈도 제한 우회).

## Follow-up criteria for revisiting

1. 사용자 N명 임계치 도달 시 M-Hybrid → M2(filter + reports only, manual 제거)로 전환하는 별도 ADR.
2. Nickname 충돌·impersonation 운영 risk가 측정되어 더 엄격한 정체성 검증이 필요해질 때.
3. Hot ranking·feature feed 등 정렬 정책 변경이 사용자 가치를 분명히 입증할 때.

## Related

- ADR 0015 — records tab entity model
- ADR 0014 — deterministic mapping (data-driven rule 동일 철학)
- ADR 0017 — closed beta operational access (admin review 인력 정의)
- `CLAUDE.md` — AI advisory invariant
