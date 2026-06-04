# Raw Notes: 스키마 & RLS 불변 규칙

> schema-rls-matrix.md에서 추출한 절대 불변 규칙. 모든 PR은 이를 위반하지 않아야 한다.

## Privacy Gate 쓰기 경계
- Privacy Gate 수락 전 생성 불가 테이블:
  - visit_inputs
  - action_split_drafts
  - split_candidates
  - care_action_cards
  - partner_share_links

## 저장 타이밍 규칙
- Capture CTA: visit_inputs + action_split_drafts만 생성
- 분류 버튼 클릭: client-side state만 변경, DB 쓰기 없음
- Confirm CTA:
  - split_candidates batch insert
  - care_action_cards 생성
  - couple_states.first_capture_completed_at = now() (null인 경우만)

## Partner 보안 규칙
- raw token 절대 저장 금지 → SHA-256(token) hash만 저장
- 파트너 직접 DB 접근 불가 → server token validation 경유
- Partner View = live server-filtered projection (frozen snapshot 없음)
- partner_share_links TTL: 7일, explicit revocation 가능

## care_action_cards 핵심 제약
- status: confirmed / completed / dismissed / revoked / superseded / archived
- medical_boundary_label: 기본값 'user_confirmed_instruction'
- partner_visible: boolean (기본값 false)
- LLM이 assigned_to, safety_level 결정 불가
- display_safety_level은 UI 우선순위이지 저장된 의학적 판단이 아님

## RLS 기본 원칙
- 인증된 사용자: 자신의 couple 데이터만 접근
- 익명 사용자: care_action_cards 또는 partner_action_views 직접 쿼리 불가
- service_role: server/Edge-controlled paths에서만

## couple 초기화 순서 (DB trigger)
```
auth.users INSERT
→ couples 행 생성
→ couple_members primary_user 행 생성
→ couple_members partner placeholder 행 생성 (user_id = NULL)
→ couple_states 행 생성
```
idempotent bootstrap fallback: GET /api/bootstrap/me

## Injection 신뢰 모델
- administered_by ≠ recorded_by ≠ confirmed_by_patient (세 값 분리 필수)
- 파트너가 주사를 놓았어도 환자가 confirm하기 전까지는 확정된 care action이 아님

## Result Protection
- 항상 무료 (Cycle Pass, 프로모션 게이트 우회)
- beta_test_recorded: negative → result_protection (다음 사이클 계획으로 바로 이동 금지)
