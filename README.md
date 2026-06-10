# Fevio [페비오]

> **시험관 시술(IVF)을 받는 환자와 파트너를 위한 케어 운영 앱**

## 누구를 위한 앱인가

- **IVF 환자** — 복잡한 병원 지시사항을 매일 실행 가능한 형태로 정리하고 싶은 사람
- **파트너** — 곁에서 돕고 싶지만 어떻게 도와야 할지 모르는 사람
- **불규칙한 스케줄** — 내원 결과에 따라 매번 달라지는 주사·투약 타이밍을 놓치지 않아야 하는 사람

## 왜 만들었나

IVF 치료는 복잡합니다. 진료 때마다 바뀌는 주사 종류·용량·시간, 병원마다 다른 안내 방식, 감정적으로 지친 상태에서 매일 같이 반복되는 실행 부담. 기존 앱들은 "정보를 보여주는 것"에 집중하지만, 정작 환자에게 필요한 것은 **오늘 이 시간에 무엇을 해야 하는지**를 정확히 알려주는 것입니다.

- 병원 안내문을 촬영하거나 붙여넣으면 → 실행 카드로 자동 분류
- 오늘의 케어 맥락에 따라 홈 화면이 달라짐 (주사 대기 / 병원 당일 / 놓친 일정 등)
- 파트너에게는 민감 정보를 제외한 오늘의 역할만 공유
- 의료 판단·진단·용량 추천은 하지 않음 — 실행 지원만

## 핵심 가치

- **Calm by default** — 불안을 자극하지 않고 다음 행동만 명확하게
- **Deterministic first** — AI 없이도 작동하는 확정적 로직 우선
- **Privacy-first** — 민감 케어 데이터는 동의 게이트 뒤에서만 기록
- **Partner-aware** — 같은 앱, 같은 상태, 역할에 맞는 다른 화면

---

**병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.**

Fevio는 IVF 치료자가 병원 안내와 투약 일정을 놓치지 않도록, 파트너와 함께 확인하고 기록하는 **치료 운영 앱**입니다.

병원에서 들은 복잡한 지시사항을 사용자가 직접 확인하고, 오늘의 실행 카드·파트너가 도울 행동·치료 맥락에 맞는 홈 화면으로 바꿉니다. AI/OCR 결과는 확정 전 후보일 뿐이며, 사용자가 확인하기 전에는 실행 일정이 되지 않습니다. Fevio는 의료 판단, 진단, 용량 추천, 치료 전략 추천을 하지 않습니다.

- Product North Star: [`docs/01-product/fevio-product-north-star.md`](docs/01-product/fevio-product-north-star.md)
- SLC 기준: [`docs/01-product/slc-target.md`](docs/01-product/slc-target.md)
- ADR: [`docs/04-decisions/`](docs/04-decisions/)

---

## 현재 배포 상태

| Lane | URL | 목적 | 상태 |
|---|---|---|---|
| Real SLC | <https://project-oznp0.vercel.app> | 실제 Auth/Supabase/RLS/Capture/Confirm/Partner 검증 | production app mode |
| Scenario testbed | <https://ai-business-group10.vercel.app/home> | 로그인 없이 Home · Calendar · Records · More 상태를 한 번에 확인 | backendless presentation mode |
| 7-stage demo | <https://ai-business-group10.vercel.app/demo?mode=stage&stage=2> | 7-stage IVF state-driven Generative UI 데모 | backendless presentation mode |

`project-oznp0`는 실제 제품 검증 레인입니다. 비로그인 `/home` 접근은 `/auth/sign-in`으로 이동해야 하며, 정상 진입 순서는 `privacy → Google 로그인 → onboarding → home`입니다.

`ai-business-group10`는 서버리스한 presentation/testbed 레인입니다. Google 로그인 없이 다음 화면을 직접 열어 최근 Fevio 변경 상태를 확인합니다.

- [`/home`](https://ai-business-group10.vercel.app/home) — 지금/놓침/병원/비어 있음 Home 시나리오 갤러리
- [`/calendar`](https://ai-business-group10.vercel.app/calendar) — 일정 후보 캘린더/타임라인 데모
- [`/records`](https://ai-business-group10.vercel.app/records) — 완료·놓침·병원 업데이트 기록 데모
- [`/more`](https://ai-business-group10.vercel.app/more) — 파트너 공유·관리 상태 데모
- [`/demo?mode=stage&stage=2`](https://ai-business-group10.vercel.app/demo?mode=stage&stage=2) — IVF 7-stage dual-panel demo

---

## 제품 핵심

Fevio가 해결하는 문제는 “정보 부족”이 아니라 **병원 지시를 일상에서 안전하게 실행 가능한 형태로 바꾸는 운영 부담**입니다.

```text
Privacy Gate
→ Google Auth
→ Onboarding role and first clinic instruction
→ Clinic memo/photo/text capture
→ LLM-assisted candidate extraction
→ Missing-field / manual review
→ User confirmation only
→ Confirmed schedule_items / care action cards
→ Care context / care state
→ Role-aware home surface
→ Partner-safe projection
```

핵심 원칙:

1. **Confirmation-first** — 확정된 care action만 실행 UI가 된다.
2. **No medical judgment** — 앱은 치료 판단, 용량 판단, 결과 해석을 하지 않는다.
3. **Partner projection, not copy** — 파트너 화면은 환자 화면 복사가 아니라 권한 기반 projection이다.
4. **State-driven Generative UI** — AI가 화면을 마음대로 그리는 것이 아니라, 관리된 컴포넌트 시스템이 care state에 맞춰 utility UI를 조립한다.
5. **Utility-first phone content** — 폰 안에는 긴 설명문이 아니라 입력, 확인, 완료, 공유 제어 같은 기능 컴포넌트만 둔다.

---

## IVF 7-stage demo architecture

Presentation demo는 static mock screen이 아닙니다. 최소한의 실제 상태 전이 구조를 가진 interactive prototype입니다.

```text
IVF_STAGE
+ ROLE
+ SHARING_LEVEL
+ UTILITY_CARD_STATE
+ ACTION_LOG
= role-aware utility UI
```

7-stage 구조:

| # | Stage | Demo focus |
|---|---|---|
| 1 | 사전 검사 | 질문과 검사 결과 정리 |
| 2 | 배란 유도 | 주사 기록, 파트너 준비 확인 |
| 3 | 난자 채취 | 시술 체크리스트, 회복 기록 |
| 4 | 수정 준비 | 민감 정보 최소 공유, privacy control |
| 5 | 배아 배양 | Day 1/3/5 timeline, 결과 공유 범위 |
| 6 | 배아 이식 | 약 루틴, hCG 검사일 |
| 7 | 임신 확인 | 결과 입력, 공유 범위, 다음 단계 |

데모 구현 기준:

- `app/demo/demo-scenarios.ts` — 7-stage scenario data
- `app/demo/demo-state.ts` — reducer, action log, partner projection
- `app/demo/patient-panel.tsx` — patient utility rendering
- `app/demo/partner-panel.tsx` — permission-based partner rendering
- `app/demo/dual-panel-demo.module.css` — product-grade phone surface styles

---

## 구현된 핵심 흐름

| 영역 | 구현 상태 | 주요 파일 |
|---|---|---|
| Privacy/Auth boundary | 개인정보 경계 → Google 로그인 → 온보딩 진입 | `app/privacy`, `app/auth/*`, `middleware.ts` |
| Onboarding extraction | 사진/문자/직접 입력 → 후보 일정 → 사용자 확인 저장 | `app/onboarding`, `app/api/onboard/*`, `supabase/functions/schedule-extract` |
| Candidate persistence | `schedule_candidates` draft → confirmed `schedule_items` | `supabase/migrations/*schedule_candidates*`, `app/api/onboard/candidates/confirm` |
| Capture / Confirm | 병원 메모 → split candidate → confirmed card | `app/capture`, `app/split-review`, `app/api/capture`, `app/api/confirm` |
| SLC Today Home | 오늘 일정·놓침·병원 방문에 따른 홈 surface | `app/(authed)/home`, `src/features/today/*`, `src/domain/slc-home-focus.ts` |
| Records / More | 완료 기록, 병원 업데이트, 파트너 공유 관리 | `app/(authed)/records`, `app/(authed)/more` |
| Partner View | raw note 없이 partner-visible action만 projection | `app/partner/[token]`, `src/domain/partner-role-projection.ts` |
| 2WW / Result Protection | 대기 운영 체계와 음성 결과 보호 surface | `src/domain/two-week-wait.ts`, `src/domain/result-protection.ts` |
| Scenario testbed | 로그인 없는 Home/Calendar/Records/More fixture surface | `src/features/presentation/*`, `src/features/today/presentation-home-demo.tsx` |
| Demo | 7-stage state-driven interactive prototype | `app/demo/*` |
| Presentation fixtures | demo/presentation cards 단일 정본 | `src/features/adaptive-home/presentation-scenarios.ts` |

---

## 데이터/안전 경계

- Raw clinic text는 partner view에 노출하지 않는다.
- Partner token은 server-controlled validation을 통과해야 한다.
- `display_safety_level`은 UI 우선순위이지 의학적 판단이 아니다.
- LLM은 비정형 병원 안내/사진/문자를 일정 후보로 바꾸는 보조 도구다. 후보는 draft이며, 사용자가 확인하기 전에는 실행 일정으로 저장하지 않는다.
- ClinicDay는 LLM 판단이 아니라 **대기실 자기 복기 세션**과 진료 후 지시 입력을 중심으로 둔다.
- 2WW는 정보 과잉이 아니라 D+n anchor, 판단 보류 UX, partner emotional support mode를 우선한다.

---

## 개발 명령

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run build
```


Production deployment guard:

```bash
git fetch origin main
git checkout --detach origin/main
npm run deploy:production
```

Do not close production-visible issues from branch-only evidence. Green evidence must cite the merged `main` commit and the `project-oznp0` deploy ID after live smoke.

Presentation mode local smoke:

```bash
FEVIO_PRESENTATION_MODE=1 npm run build
FEVIO_PRESENTATION_MODE=1 npx next start -p 3010
curl -I 'http://localhost:3010/home'
curl -I 'http://localhost:3010/calendar'
curl -I 'http://localhost:3010/records'
curl -I 'http://localhost:3010/more'
curl -I 'http://localhost:3010/demo?mode=stage&stage=2'
```

---

## 검증 기준

일반 변경 후 최소 검증:

```bash
npm run test
npm run typecheck
npm run build
```

Demo/UI 변경 시 추가로 확인할 것:

- `project-oznp0.vercel.app/home`은 비로그인 상태에서 `/auth/sign-in`으로 보호된다.
- `ai-business-group10.vercel.app/home`, `/calendar`, `/records`, `/more`는 Google 로그인 없이 200으로 열린다.
- `/demo?mode=stage&stage=1..7` deep link가 stage와 일치한다.
- phone 내부에 내부 component/type name이 노출되지 않는다.
- 한글 세로 줄바꿈이 없다.
- Stage 7 공유 범위 변경 시 partner panel이 실제로 달라진다.
- `phaseHero_coral/sage/lavender`, `partnerHero_coral/sage/lavender`만 사용하고 legacy 3-scene CSS class를 되살리지 않는다.

---

## 주요 문서

- Documentation map: [`docs/README.md`](docs/README.md)
- Domain language: [`CONTEXT.md`](CONTEXT.md)
- Product origin note: [`docs/01-product/original-note-hyunjoo.md`](docs/01-product/original-note-hyunjoo.md)
- Product North Star: [`docs/01-product/fevio-product-north-star.md`](docs/01-product/fevio-product-north-star.md)
- PRD: [`docs/01-product/prd-v1.0.md`](docs/01-product/prd-v1.0.md)
- Architecture scorecard: [`docs/02-design/architecture-scorecard.md`](docs/02-design/architecture-scorecard.md)
- Refactor North Star: [`docs/03-engineering/refactor-north-star.md`](docs/03-engineering/refactor-north-star.md)
- Deployment readiness: [`docs/03-engineering/deployment-readiness.md`](docs/03-engineering/deployment-readiness.md)
- Release baseline 2026-05-12: [`docs/03-engineering/release-baseline-2026-05-12.md`](docs/03-engineering/release-baseline-2026-05-12.md)
- Contributor guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## Secret policy

Do not commit real secrets.

- Commit `.env.example` only.
- Keep real `.env`, `.env.local`, `.env.production`, `.vercel/`, Supabase temp files, dumps, and credentials out of git.
- Backendless team demos must use `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1` or `FEVIO_PRESENTATION_MODE=1` instead of shared Supabase/Google OAuth secrets.
- Browser-public Supabase config still belongs in Vercel/Supabase env settings, not hardcoded constants.
