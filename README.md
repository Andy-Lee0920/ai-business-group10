# Fevio [페비오]

**Same app. Shared state. Different experience.**

Fevio는 하나의 IVF care cycle state를 환자와 파트너의 역할에 맞는 utility interface로 변환하는 **state-driven Generative UI Care OS**입니다.

병원에서 들은 복잡한 지시사항을 사용자가 직접 확인하고, 오늘의 실행 카드·파트너가 도울 행동·치료 맥락에 맞는 홈 화면으로 바꿉니다. Fevio는 의료 판단, 진단, 용량 추천, 치료 전략 추천을 하지 않습니다.

- Product North Star: [`docs/01-product/fevio-product-north-star.md`](docs/01-product/fevio-product-north-star.md)
- SLC 기준: [`docs/01-product/slc-target.md`](docs/01-product/slc-target.md)
- ADR: [`docs/04-decisions/`](docs/04-decisions/)

---

## 현재 배포 상태

| Lane | URL | 목적 | 상태 |
|---|---|---|---|
| Real SLC | <https://project-oznp0.vercel.app> | 실제 Auth/Supabase/RLS/Capture/Confirm/Partner 검증 | production app mode |
| Presentation demo | <https://ai-business-group10.vercel.app/demo?mode=stage&stage=2> | 7-stage IVF state-driven Generative UI 데모 | backendless presentation mode |

`project-oznp0`는 실제 제품 검증 레인입니다. `/demo`는 presentation host에서만 열리며, real lane에서는 backend-first 제품 흐름을 보호하기 위해 demo route가 열리지 않는 것이 정상입니다.

---

## 제품 핵심

Fevio가 해결하는 문제는 “정보 부족”이 아니라 **병원 지시를 일상에서 안전하게 실행 가능한 형태로 바꾸는 운영 부담**입니다.

```text
Privacy Gate
→ Clinic memo capture
→ Manual split review
→ User confirmation
→ Confirmed care action cards
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
| Privacy/Auth boundary | 개인정보·의료 경계 후 민감 데이터 입력 | `app/privacy`, `app/auth/*`, `middleware.ts` |
| Capture / Confirm | 병원 메모 → split candidate → confirmed card | `app/capture`, `app/split-review`, `app/api/capture`, `app/api/confirm` |
| Adaptive Home | care context에 따른 홈 surface | `app/(authed)/home`, `src/features/adaptive-home/*` |
| Partner View | raw note 없이 partner-visible action만 projection | `app/partner/[token]`, `src/domain/partner-role-projection.ts` |
| 2WW / Result Protection | 대기 운영 체계와 음성 결과 보호 surface | `src/domain/two-week-wait.ts`, `src/domain/result-protection.ts` |
| Demo | 7-stage state-driven interactive prototype | `app/demo/*` |
| Presentation fixtures | demo/presentation cards 단일 정본 | `src/features/adaptive-home/presentation-scenarios.ts` |

---

## 데이터/안전 경계

- Raw clinic text는 partner view에 노출하지 않는다.
- Partner token은 server-controlled validation을 통과해야 한다.
- `display_safety_level`은 UI 우선순위이지 의학적 판단이 아니다.
- LLM 기능은 P0 실행 경로에 없다. 수동 workflow가 먼저 동작해야 한다.
- ClinicDay는 LLM 대화가 아니라 **대기실 자기 복기 세션**과 진료 후 지시 입력을 중심으로 둔다.
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

Presentation mode local smoke:

```bash
FEVIO_PRESENTATION_MODE=1 npm run build
FEVIO_PRESENTATION_MODE=1 npx next start -p 3010
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
