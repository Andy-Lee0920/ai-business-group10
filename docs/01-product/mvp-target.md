# Fevio [페비오] MVP Product Definition

## MVP meaning

**MVP = SLC + AI Assist + Active Reminders + Active Partner View**

SLC는 MVP의 첫 internal milestone으로 유지된다. SLC가 완료되어야 MVP 레이어를 안전하게 쌓을 수 있다.

```text
SLC  ⊂  MVP
```

## MVP one-line definition

> Fevio는 IVF 치료자가 병원 안내와 투약 일정을 놓치지 않도록, 파트너와 함께 확인하고 기록하는 치료 운영 앱이다.

핵심 가치 명제는 "정서 케어"나 "단순 투약 관리"가 아니라 **"병원 안내를 오늘 실행으로 바꾸고, 파트너가 감시자가 아니라 실질적 분담자가 되게 하는 것"**이다.

## Feedback-prioritized cut

### Customer experience contract

MVP는 사용자가 "단순 캘린더"에 돈을 내는 것이 아니라, 치료 운영 부담이 실제로 줄었다고 느끼게 해야 한다. 따라서 모든 P0 화면은 다음 질문을 통과해야 한다.

- 오늘 해야 할 주사·약·내원·확인할 일을 병원 안내문, 카톡, 사진, 메모를 다시 뒤지지 않고 바로 보여주는가?
- 입력을 줄이되 AI/OCR 후보를 사용자가 원문 기준으로 최종 확인하고 저장하게 하는가?
- 시간 민감한 주사, 약 이름, 용량을 조용하지만 정확하게 강조하는가?
- 파트너에게 전체 의료정보가 아니라 오늘 도울 역할만 공유하는가?
- 검사 결과, 감정 기록, 병원 원문, 상세 의료기록의 공유권을 사용자에게 남기는가?
- 시험관 초입 사용자가 채취, 배양, 이식 등 현재 단계를 짧게 이해할 수 있는가?
- 알림과 문구가 재촉하거나 감정 케어를 강요하지 않는가?
- 시술 기간에 집중적으로 쓰이는 실용 도구로 보이는가?
- 사진/문자 자동 정리, 원문 확인, 중요 알림, 파트너 역할 공유가 단순 캘린더보다 확실한 편의와 신뢰를 만드는가?

### Must

- 병원 안내문 사진/문자/직접 입력을 확정 전 후보 카드로 만들고, 사용자가 원문 기준으로 확인한 뒤에만 실행 일정으로 저장한다.
- Home 첫 화면은 오늘 주사·약·방문·놓친 확인을 가장 먼저 보여주고, 임박/미완료 카드는 Daily Brief보다 우선한다.
- 파트너 화면은 환자 화면 복사가 아니라 "오늘 함께 챙길 역할"만 보여준다. 원문 안내, 민감 메모, 약 세부값은 공유 범위 밖이면 노출하지 않는다.
- 모든 AI/OCR 결과는 advisory only다. 사용자가 확정하기 전에는 알림, 완료, 파트너 공유의 근거가 될 수 없다.
- 의료 판단, 용량 추천, 치료 전략 추천을 하지 않는다는 경계를 visible copy와 테스트 계약으로 유지한다.

### Should

- 오늘 일정과 기록에서 약명 텍스트만이 아니라 혼동 방지를 돕는 참고 이미지를 함께 보여준다.
- 알림과 카운트다운은 정확해야 하지만 압박감을 만들지 않도록 톤과 단위를 조정한다. 임박 실행은 명확하게, 평상시는 조용하게 둔다.
- 병원 안내 원문과 AI가 만든 후보 카드의 연결 근거를 사용자가 확인할 수 있게 한다.
- 진료 시 의사에게 보여줄 수 있는 완료/놓침/변경 리포트의 기본 형태를 준비한다.
- 보안, 저장 범위, 파트너 공유 범위, 삭제 가능성을 설정/동의 화면에서 명확히 보여준다.

### Later

- 지원금, 영수증, 보험 청구, 병원 시스템 연동은 치료 운영 앱의 확장 가치로 두되 MVP 중심을 흐리지 않는다.
- 멘탈 케어, 커뮤니티, 챗봇은 반복 사용 이유를 보강할 수 있지만 투약·일정·확인 플로우가 안정된 뒤에 붙인다.
- 임신 중/출산 후/만성질환 복약 관리 등 인접 확장은 IVF 치료 운영의 일일 사용성이 검증된 뒤 판단한다.

## Target

closed beta — 주변 사용자 대상 자발적 검증. disclaimer는 앱 외부에서 별도 전달.

---

## P0 (반드시 포함 — 7개 축)

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

### 7. Daily Brief

- 홈 default surface. `confirmedPhase` (ADR 0011) + `phaseCareDay` (ADR 0008) + `dayIndexInPhase` 입력으로 admin-keyed LLM 이 생성
- 의료 fact 는 운영팀 큐레이션 dict (KSRM/ASRM 가이드라인 + 식약처 e-제약 공개 데이터) 에서만 인용
- 매일 1회 + CycleEvent critical event (trigger / retrieval / transfer / beta) 트리거 추가
- Partner Brief 는 별도 LLM 호출, 한 줄 + 행동 1개 형식 (ADR 0023)
- Brief Reflection Turn (사용자 self-initiated 한 줄 input + LLM reply) 은 ephemeral, 저장하지 않음 (ADR 0025)
- 첫 viewport 는 Brief 한 줄 + Execution preview 카드 (ADR 0022 priority renderer)
- LLM 실패 / guardrail reject 시 deterministic dict raw text 폴백
- LLM 사용은 closed beta exploration 한정, production destination 은 deterministic template pool (ADR 0021)
- 관련 ADR: 0021, 0022, 0023, 0024, 0025

---

## P0 Release Gates (URL-action-result 형식)

1. `/onboard/prescription-capture`에서 사용자가 병원 안내문 사진을 올렸을 때 카드 후보가 보이고 "확인 후 저장" 단계가 있다.

2. `/onboard`에서 사용자가 split 카드 후보를 검토할 때 카드별 owner(나/파트너) 및 카드 타입을 직접 확정한다. AI 제안이 있으면 바탕으로 확정하며, AI가 없는 경우 수동 분류로 동일한 확정 단계를 완수할 수 있다.

3. `/home`에서 당사자가 홈을 열었을 때 오늘 주사 시간·약 이름·주사 위치가 한 화면에 보인다.

4. T-15분 시점에 사용자가 PWA 웹 push 알림을 받았을 때 해당 카드로 바로 이동하여 완료 처리할 수 있다.

5. `/partner/[token]`에서 파트너가 링크를 열었을 때 "오늘 도와줄 일"이 partner_action 문구로 보이고, 당사자가 완료 처리하면 5초 안에 파트너 화면에 반영된다. 파트너도 "도움 완료" 처리를 할 수 있다.

6. 어떤 화면에서도 LLM이 진단·용량 조정·치료 권고 문구를 출력하지 않는다.

7. `/home` 평상시 (시간 임박 카드 없음) 에 사용자가 진입하면 첫 viewport 에 Daily Brief 한 줄 + Execution preview 카드 1개가 보인다.

8. `/home` 에서 사용자가 "오늘의 한 줄" CTA 를 누르면 ephemeral input 이 열리고, 발화 후 LLM 응답이 표시되며, 페이지 이동 시 발화·응답 모두 저장되지 않고 폐기된다.

9. `/partner/[token]` 에서 partner 가 링크를 열면 partner 전용 momentLine + helpAction 형식의 Partner Brief 가 보이고, primary 의 의료 fact / 약 이름 / 감정 발화는 노출되지 않는다.

10. LLM 호출 실패 또는 guardrail reject 발생 시 Daily Brief 자리에 운영팀 큐레이션 dict 의 raw text 가 즉시 표시된다 (surface 자체가 비지 않는다).

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
- **BYOK 정책은 OCR 영역에만 적용된다**. Daily Brief 와 Partner Brief 의 LLM 호출은 admin-keyed (운영팀 서버 키) 만 사용한다 (ADR 0021).
- BYOK 키는 Supabase Vault, 브라우저 노출 금지
- OCR 사용자 키 없어도 manual split 경로로 모든 P0 워크플로우 완수 가능
- Daily Brief 의 LLM 실패 시 deterministic dict raw text 폴백으로 "Manual P0 must work without LLM" invariant 충족 (LLM 의존성 정책 분리)
- 이미지 처리: OpenRouter에 signed URL 전달, 처리 후 버킷 내 보관 (사용자 데이터)
- Brief Reflection Turn 발화·응답 본문은 어떤 테이블에도 저장되지 않는다 (ADR 0025)

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

## Daily Brief decisions (grilling 2026-05-21)

| 결정 | 내용 | ADR |
|---|---|---|
| Daily-open hook | Hybrid — Operation backbone + Daily Brief priority renderer | 0021, 0022 |
| Brief content engine | LLM 생성 + deterministic fact guardrail dict | 0021 |
| LLM access | Admin-keyed (운영팀 서버 키), BYOK 는 OCR 한정 | 0021 |
| LLM intent | Closed beta exploration tool, production destination = deterministic template pool | 0021 |
| Visual identity | No mascot, botanical / abstract only | 0024 |
| Fact ground truth | 운영팀 큐레이션 (KSRM/ASRM 가이드라인 + 식약처 공개 데이터) | 0021 |
| Medication detail | Care card detail sheet (본인 약) + Brief inline (stage 보편) | 0021 |
| Partner brief | 별도 brief — momentLine + helpAction | 0023 |
| Brief cadence | 매일 1회 + CycleEvent critical event-triggered | 0021 |
| Self-reflection | Ephemeral (저장 없음), self-initiated pull 패턴만 | 0025 |
| 첫 viewport | Brief 한 줄 + execution preview 카드 | 0022 |
| Empty home brief | Stage-neutral universal brief (partner-link 무관) | 0021 |

## Source reading order

1. `docs/01-product/original-note-hyunjoo.md` — 제품 원점
2. `docs/01-product/slc-target.md` — SLC (MVP 첫 milestone)
3. 이 문서 (`mvp-target.md`) — MVP 범주 정의
4. `docs/01-product/prd-v1.0.md` — PRD 구현 세부
5. `docs/04-decisions/` — 아키텍처 결정 (Daily Brief 관련: 0021–0025)
