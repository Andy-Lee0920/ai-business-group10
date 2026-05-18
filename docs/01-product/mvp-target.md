# Fevio [페비오] MVP Product Definition

## MVP meaning

**MVP = SLC + AI Assist + Active Reminders + Active Partner View**

SLC는 MVP의 첫 internal milestone으로 유지된다. SLC가 완료되어야 MVP 레이어를 안전하게 쌓을 수 있다.

```text
SLC  ⊂  MVP
```

## MVP one-line definition

> Fevio MVP는 IVF 투약 안내문을 사진으로 넣으면, 오늘 해야 할 주사·약·방문 일정을 정리하고, 당사자와 파트너가 함께 놓치지 않도록 알려주는 공동 케어 앱이다.

핵심 가치 명제는 "투약 관리"가 아니라 **"파트너가 관심은 있는데 뭘 해야 할지 모르는 상태"를 해결하는 것**이다.

## Target

closed beta — 지인 대상 자발적 검증. disclaimer는 앱 외부에서 별도 전달.

---

## P0 (반드시 포함 — 6개 축)

### 1. Input

- 텍스트 붙여넣기 (SLC에서 이어짐)
- 사진 업로드 → OpenRouter Vision 추출 (이미 구현됨)
- 사진은 Supabase `clinic-photos` 버킷에 저장, `schedule_candidates.image_path`로 참조

구현 상태: `photo-upload` + `photo-analyze` + `text-analyze` API 및 `schedule-extract` Edge Function 모두 배포됨.

모델 전환: `OPENROUTER_VISION_MODEL=google/gemini-3-flash-preview` env var 교체로 완료.

### 2. Translation

- `schedule-extract` Edge Function이 deterministic-first → LLM fallback 순서로 카드 후보 추출
- 사용자가 각 후보의 owner(나/파트너)와 card_type을 직접 확정
- LLM은 advisory only: `assigned_to`, `card_type`, safety priority를 결정하지 않는다
- **수동 분류 경로는 항상 동일한 화면에 존재해야 한다** (LLM 없어도 확정 완수 가능)

### 3. Today Home

- 오늘 주사 시간·약 이름·주사 위치·준비물 명확 표시
- 카드 정보 밀도 SLC 대비 강화

### 4. Reminder

- 채널: **PWA 웹 push** (이메일/Resend 사용 안 함)
- 타이밍: T-60분 전 + T-15분 전 (2회)
- 스케줄러: Supabase pg_cron (매분 실행)
- Android Chrome/Edge: 설치 없이 지원
- iOS Safari 16.4+: 홈화면 추가(Add to Home Screen) 필요 — 초기 MVP는 Android 우선
- 관련 이슈: #347

### 5. Partner View

- "오늘 도와줄 일" 중심 (partner_action 카드 우선 노출)
- 파트너도 "도움 완료" 처리 가능 (`record_assist` 액션, 이미 구현됨)
- 당사자 완료 → 파트너 화면 **3초 폴링**으로 5초 내 반영
- 양방향 완료: 당사자 완료 (`care_action_cards`) + 파트너 도움 완료 (`injection_logs.administered_by: 'partner'`) 분리

### 6. Safety Boundary

- closed beta 대상: 앱 내 disclaimer UI 불필요, 외부 전달로 대체
- `schedule-extract` 시스템 프롬프트의 의료 판단 금지 제약 유지
- LLM이 진단·용량 판단·복약 권고 출력 시 해당 candidate 제거 (프롬프트 레벨)

---

## P0 Release Gates (URL-action-result 형식)

1. `/onboard/prescription-capture`에서 사용자가 병원 안내문 사진을 올렸을 때 카드 후보가 보이고 "확인 후 저장" 단계가 있다.

2. `/onboard`에서 사용자가 split 카드 후보를 검토할 때 카드별 owner(나/파트너) 및 카드 타입을 직접 확정한다. AI 제안이 있으면 바탕으로 확정하며, AI가 없는 경우 수동 분류로 동일한 확정 단계를 완수할 수 있다.

3. `/home`에서 당사자가 홈을 열었을 때 오늘 주사 시간·약 이름·주사 위치가 한 화면에 보인다.

4. T-15분 시점에 사용자가 PWA 웹 push 알림을 받았을 때 해당 카드로 바로 이동하여 완료 처리할 수 있다.

5. `/partner/[token]`에서 파트너가 링크를 열었을 때 "오늘 도와줄 일"이 partner_action 문구로 보이고, 당사자가 완료 처리하면 5초 안에 파트너 화면에 반영된다. 파트너도 "도움 완료" 처리를 할 수 있다.

6. 어떤 화면에서도 LLM이 진단·용량 조정·치료 권고 문구를 출력하지 않는다.

---

## P1 (가능하면 포함)

- 중복 일정 감지 로직 (Confirm 트랜잭션 시)
- Today 카드 Collapse UX (완료된 카드 자동 접힘)
- Completed / Pending / Missed 상태 체계
- Owner / Partner 질문 구조 분리 (Onboarding)
- 파트너 미동행 상황 대응 UX
- iOS PWA 홈화면 추가 유도 UI

---

## Post-MVP Backlog (명확히 제외)

- 착상 대기 2주 전용 케어 UX (`waiting_day`는 SLC P0에 있으나 전용 UX는 제외)
- 증상 기록 기능
- 병원에 물어볼 질문 정리
- 파트너 행정 체크리스트 (영수증·지원금)
- 멘탈 케어 챗봇/안심 메시지 자동화
- 카카오 알림톡/SMS
- 자연 임신 준비 전체 확장
- IVF 전체 여정 관리 (시술 전/후 관리)
- 의료 상담/진단성 답변 (영구 제외)

---

## Data/Security invariants (SLC에서 승계)

- RLS로 couple-scoped 데이터 격리
- Partner raw token 미저장 (해시만)
- LLM 출력은 advisory only — `assigned_to` / `card_type` / safety priority 결정 불가
- BYOK 키는 Supabase Vault, 브라우저 노출 금지
- 사용자 키 없어도 manual split 경로로 모든 P0 워크플로우 완수 가능
- 이미지 처리: OpenRouter에 signed URL 전달, 처리 후 버킷 내 보관 (사용자 데이터)

---

## Implementation decisions (interview 2026-05-18)

| 결정 | 내용 |
|---|---|
| AI Translation P0 | Option A: 수동 경로 항상 동일 화면에 존재 |
| OCR 엔진 | OpenRouter Vision (`OPENROUTER_VISION_MODEL` env var), 현재 `anthropic/claude-haiku-4.5` → `google/gemini-3-flash-preview`로 교체 예정 |
| 이미지 저장 | Supabase Storage 보관 (`clinic-photos`), `image_path` 참조 |
| Reminder 채널 | PWA 웹 push (ADR 0004 개정) |
| Reminder 스케줄러 | Supabase pg_cron |
| Partner 완료 | 양방향 — 파트너 `record_assist` 이미 구현됨 |
| 5초 동기화 | 3초 폴링 |
| Safety Boundary | closed beta: 프롬프트 제약만, 앱 내 disclaimer 없음 |

## Source reading order

1. `docs/01-product/original-note-hyunjoo.md` — 제품 원점
2. `docs/01-product/slc-target.md` — SLC (MVP 첫 milestone)
3. 이 문서 (`mvp-target.md`) — MVP 범주 정의
4. `docs/01-product/prd-v1.0.md` — PRD 구현 세부
5. `docs/04-decisions/` — 아키텍처 결정
