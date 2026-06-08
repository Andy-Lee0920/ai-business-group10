# Fevio [페비오]

> **시험관 시술(IVF)을 받는 환자와 파트너를 위한 care-operation support webapp**

Fevio는 병원 안내와 투약 일정을 사용자가 직접 확인한 **오늘의 실행 카드**로 바꾸고, 파트너에게는 민감 정보를 제외한 지원 역할만 공유합니다.

Fevio는 의료 판단, 진단, 용량 추천, 치료 전략 추천을 하지 않습니다. AI/OCR 결과는 확정 전 후보일 뿐이며, 사용자가 확인하기 전에는 실행 일정이 되지 않습니다.

## 누구를 위한 앱인가

- **Primary user / IVF 환자** — 복잡한 병원 지시사항을 매일 실행 가능한 형태로 정리하고 싶은 사람
- **Partner** — 환자의 선택과 공유 범위 안에서 오늘 도울 일을 알고 싶은 사람
- **불규칙한 스케줄** — 내원 결과에 따라 달라지는 주사·투약·병원 일정을 놓치지 않아야 하는 사람

## 제품 한 줄

**병원 안내를 오늘 실행으로, 파트너에게는 함께 챙길 역할로.**

핵심 가치는 다음과 같습니다.

- **Calm by default** — 불안을 자극하지 않고 다음 행동만 명확하게 보여준다.
- **Confirmation-first** — 사용자가 확인한 care action만 실행 UI가 된다.
- **Deterministic first** — AI 없이도 작동하는 확정적 로직을 우선한다.
- **Privacy-first** — 민감 케어 데이터는 동의와 권한 경계 뒤에서만 기록·공유한다.
- **Partner-aware** — 파트너 화면은 환자 화면 복사가 아니라 sanitized projection이다.

## Active app path

실제 제품 루프는 다음 경로를 중심으로 이해합니다.

```text
/privacy
→ /auth/sign-in
→ /onboarding
→ /home
→ /capture or /clinic-update
→ /split-review
→ confirmed care_action_cards
→ /calendar, /records, /more, /partner
```

주요 화면:

- `/home` — 오늘의 care context와 실행 카드
- `/capture`, `/clinic-update`, `/split-review` — 병원 안내 입력, 후보 확인, 사용자 확정
- `/calendar`, `/records` — 일정과 기록
- `/more`, `/partner` — 파트너 공유와 partner-safe view
- `/demo` — product/demo 설명용 시나리오 surface; 현재 작업 상태의 source of truth가 아님

## Quickstart

```bash
npm install
npm run dev
```

기본 검증:

```bash
npm run test
npm run typecheck
npm run build
```

Production deploy와 live smoke는 README가 아니라 전용 runbook을 따릅니다.

- [`docs/03-engineering/deployment-readiness.md`](docs/03-engineering/deployment-readiness.md)
- [`docs/03-engineering/vercel-preview-sop.md`](docs/03-engineering/vercel-preview-sop.md)
- [`docs/03-engineering/slc-release-gate-checklist.md`](docs/03-engineering/slc-release-gate-checklist.md)

## Source-of-truth docs

처음 기여자는 이 순서로 읽습니다.

1. [`docs/SPEC_INDEX.md`](docs/SPEC_INDEX.md) — current vs historical spec map
2. [`docs/README.md`](docs/README.md) — documentation navigation map
3. [`docs/01-product/original-note-hyunjoo.md`](docs/01-product/original-note-hyunjoo.md) — originating user pain
4. [`docs/01-product/prd-v1.0.md`](docs/01-product/prd-v1.0.md) — current product decisions
5. [`docs/01-product/slc-target.md`](docs/01-product/slc-target.md) — current release gate
6. [`docs/01-product/fevio-product-north-star.md`](docs/01-product/fevio-product-north-star.md) — product north star
7. [`docs/04-decisions/`](docs/04-decisions/) — durable ADR decisions
8. [`CONTEXT.md`](CONTEXT.md) and [`AGENTS.md`](AGENTS.md) — domain language and agent/developer constraints
9. [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow

Current work, stale status, and Red → Green evidence belong in GitHub, not README.

- Issues: <https://github.com/Andy-Lee0920/ai-business-group10/issues>
- Pull requests: <https://github.com/Andy-Lee0920/ai-business-group10/pulls>

## Safety invariants

Keep these true across changes.

- **No medical judgment** — Fevio does not diagnose, recommend dosage, or decide treatment strategy.
- Raw clinic text는 partner view에 노출하지 않는다.
- Partner access must be server-filtered and scoped to the approved linked patient/couple.
- `care_action_cards` is the canonical confirmed care-action read model.
- `schedule_items` is legacy compatibility only; do not remove fallback paths without a dedicated proof slice.
- Draft extraction, uncertain candidates, and AI/OCR suggestions must not become executable care before user confirmation.
- `display_safety_level` is UI priority, not medical judgment.
- Schema changes need an RLS and test story.
- Real secrets must never be committed.

## Repository hygiene rule

Keep README stable and short:

- Product identity, quickstart, source-of-truth docs, and safety invariants stay here.
- Demo architecture, deployment lane dashboards, migration history, implementation tables, sprint status, and stale issue/PR notes move to docs or GitHub.
- Historical/background material belongs under [`docs/archive/`](docs/archive/) or a clearly labeled spec/ADR.

See [`docs/03-engineering/repo-hygiene-triage.md`](docs/03-engineering/repo-hygiene-triage.md) for the 2026-06-08 README and stale GitHub work-item audit.

## Open-source and AI contribution baseline

- License: [`LICENSE`](LICENSE) — Apache-2.0.
- AI contribution logs: [`docs/ai-logs/README.md`](docs/ai-logs/README.md).
- Dependency notice baseline: [`docs/specs/open-source-licenses.md`](docs/specs/open-source-licenses.md).

## Secret policy

Do not commit real secrets.

- Commit `.env.example` only.
- Keep real `.env`, `.env.local`, `.env.production`, `.vercel/`, Supabase temp files, dumps, and credentials out of git.
- Backendless team demos must use `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1` or `FEVIO_PRESENTATION_MODE=1` instead of shared Supabase/Google OAuth secrets.
- Browser-public Supabase config belongs in Vercel/Supabase env settings, not hardcoded constants.
