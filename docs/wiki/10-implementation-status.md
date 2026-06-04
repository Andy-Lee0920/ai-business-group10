# 현재 구현 상태와 다음 우선순위

> 이 페이지는 2026-06-04 기준 상태다. 이후 변경은 GitHub Issues와 README.md를 우선 참고.

## 배포 환경

| Lane | URL | 목적 |
|---|---|---|
| Real SLC (production) | `project-oznp0.vercel.app` | 실제 Auth/Supabase/RLS 검증 |
| Scenario testbed | `ai-business-group10.vercel.app/home` | 로그인 없이 홈/캘린더/기록/더보기 |
| 7-stage demo | `ai-business-group10.vercel.app/demo?mode=stage&stage=2` | IVF 7-stage state-driven demo |

## 구현 완료된 흐름

### Privacy / Auth / Onboarding
- Google OAuth + couple shell bootstrap DB trigger
- Privacy Gate → onboarding home 진입
- `app/privacy`, `app/auth/*`, `middleware.ts`

### 온보딩 입력 → 일정 후보 → 확인 저장 (Issues #312–#323)
```
raw hospital instruction
→ 사진/문자 LLM extract / 직접 입력
→ draft candidates (schedule_candidates)
→ 사용자 검토·편집
→ 사용자 확인
→ confirmed schedule_items
→ home renders executable cards
```

핵심 구현:
- `app/api/onboard/photo-upload`, `photo-analyze` — OCR Edge Function 연동
- `app/api/onboard/candidates/confirm` — 사용자 Confirm 저장
- `supabase/functions/schedule-extract` — image/text 분석 Edge Function

### Capture / Confirm (SLC spine)
- `app/capture` → `app/split-review` → `app/api/capture` → `app/api/confirm`
- `care_action_cards` canonical table

### Partner View
- `app/partner/[token]` — raw note 없이 partner-visible action만 projection
- `src/domain/partner-role-projection.ts`

### 2WW / Result Protection
- `src/domain/two-week-wait.ts`
- `src/domain/result-protection.ts`

### Policy Support (Hybrid RAG) — 최근 추가
- `app/api/policy-support/evaluate/route.ts` (Hot Path, 13x)
- `app/(authed)/policy-support/page.tsx` (Hot Path, 11x)
- `src/domain/policy-support.ts` (Hot Path, 9x)

## 진행 중인 Epic: Home storyline (Issues #341–#347)

홈을 정적 카드 그리드가 아니라 4상태 스토리라인으로 재편하는 작업.

```text
Injection countdown → clinic day → post-clinic follow-up → quiet default
```

| Issue | 상태 | 내용 |
|---|---|---|
| #341 | Open Epic | Home 4상태 스토리라인 재편 |
| #342 | Open | 60분 윈도우 기반 SVG `InjectionCountdownArc` |
| #343 | Open | 주사/진료일/진료후/기본 hero 스위처 |
| #344 | Open | 진료 후 `병원 다녀오셨나요?` 플로팅 배너 |
| #347 | Open | 주사 1시간 전·15분 전 알림 Edge Function |

## 다음 IA / Navigation 묶음 (Issues #352–#357)

| Issue | 내용 |
|---|---|
| #352 | BottomNav 3탭 → 홈/캘린더/+/기록/설정 5탭 |
| #353 | `/add`와 `/clinic-update`가 같은 입력 파이프라인 공유 |
| #354 | `+` 바텀시트: 일정 추가 / 병원 메모 선택 |
| #355 | `/calendar` 월 뷰 → 날짜별 care card timeline |
| #356 | `/records` 영수증 단건 입력과 누적 합산 |
| #357 | `/more` → `/settings` 이관, 파트너 연결 통합 |

## 미완료된 핵심 마이그레이션

### ADR 0013: care_action_cards로 홈 reader 통합
- `/home`이 아직 `schedule_items`를 primary로 읽는 부분 존재
- #376-B: `TodayScreen`을 `care_action_cards` primary read로 전환
- #376-A: photo-analyze write path를 `split_candidates → care_action_cards`로 연결

### 테스트 커버리지 (2026-05-28 baseline)
```
Statements: 46.4% (1794/3866)
Branches:   37.12% (1269/3418)
Functions:  47.97% (545/1136)
Lines:      48.25% (1553/3218)
```

미완성 영역:
- UI Component Unit Tests: `src/components` (13 files, 대부분 <40%)
- Feature-Level Unit Tests: `src/features` (41 files, 많은 수 0%)
- Integration Test Expansion: RLS/security boundary coverage

## 관리 중인 ADR 현황 (0029까지)

| 번호 | 제목 | 상태 |
|---|---|---|
| 0001 | SLC-first, manual-first | Accepted |
| 0007 | Privacy delete boundary | Accepted |
| 0009 | State-driven Generative UI | Accepted |
| 0011 | CycleEvent state machine | Accepted |
| 0013 | Confirm spine canonical | Accepted |
| 0021 | Daily Brief LLM exploration | Accepted |
| 0023 | Partner Brief separate contract | Accepted |
| 0029 | Confirm UI inline quote rule | Accepted |

## 성공 지표 (v1.0 목표)

| 지표 | 목표 |
|---|---|
| Capture completion rate | >80% |
| Manual Split completion rate | >70% |
| Confirmed card creation after Capture | >60% |
| Partner link open rate | >60% |
| Partner acknowledgement rate | >40% |
| Critical missed event | 0 reported cases |

핵심 정성 질문:
> "병원 다녀온 뒤 파트너에게 설명하는 부담이 줄었나요?"

## 검증 기준 (완료 조건)

```bash
npm run test       # unit + integration tests
npm run typecheck  # tsc --noEmit
npm run build      # build success
```

추가 확인:
- `project-oznp0.vercel.app/home`은 비로그인 시 `/auth/sign-in`으로 보호
- `ai-business-group10.vercel.app/home`은 로그인 없이 200 반환
- Stage 7에서 공유 범위 변경 시 partner panel이 실제로 달라짐
- phone 내부에 컴포넌트/타입 이름 노출 없음

---

**관련 페이지:** [06-care-loop-architecture.md](06-care-loop-architecture.md) | [07-data-model.md](07-data-model.md) | [09-dynamic-home-careday.md](09-dynamic-home-careday.md)
