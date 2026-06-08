# Fevio spec index

This is the human-readable map for deciding which Fevio documents are current requirements, which are implementation guides, and which are historical context.

Use it before coding. It is intentionally optimized for first-time human developers, not only for AI agents.

## Current source of truth

| Classification | Documents | How to use |
|---|---|---|
| Product origin | `docs/01-product/original-note-hyunjoo.md` | Highest-priority user pain: IVF schedule complexity, medication/injection timing risk, partner information asymmetry, emotional load, and sensitive-data trust. |
| Canonical product spec | `docs/01-product/prd-v1.0.md` | Current v1 implementation decisions and scope. Treat this as the main PRD, but do not let it erase the original user pain. |
| Current release gate | `docs/01-product/slc-target.md` | The active Simple/Lovable/Complete webapp loop and acceptance evidence. |
| Product north star | `docs/01-product/fevio-product-north-star.md` | Product identity and direction for care-operation surfaces. |
| Repo mental model | `AGENTS.md`, `CONTEXT.md` | Stable domain invariants and agent/developer constraints. Use after the product docs, not instead of them. |

## Empathy context for all specs

Fevio supports people going through IVF, where operational mistakes and emotional timing can feel high-stakes. The primary user is the patient / prospective mother. Partner surfaces exist to support her care context, not to take control away from her.

Important safety interpretations:

- **Confirmation-first care actions** mean draft extraction is not executable care. The patient confirms meaning, timing, and ownership before it becomes a care action.
- **Result Protection Mode** is an emotional safety mechanism for sensitive waiting/result states, not just a rendering condition.
- **Partner visibility** is a privacy and consent boundary. A partner-visible card is still scoped, sanitized, and controlled by the patient/couple relationship.
- **Partner View** must not expose raw clinic text, override patient choices, or turn support into surveillance.

## Implementation guides

| Area | Documents | Notes |
|---|---|---|
| Contribution flow | `CONTRIBUTING.md`, `docs/05-contribution/specctl-by-junhyun.md` | Human workflow and specctl notes. |
| Schema/RLS/security | `docs/03-engineering/schema-rls-matrix.md` | Start here before changing Supabase tables, RLS, partner access, or service-role code. |
| Release/deploy | `docs/03-engineering/deployment-readiness.md`, `docs/03-engineering/vercel-preview-sop.md`, `docs/03-engineering/slc-release-gate-checklist.md` | Use for Vercel/Supabase evidence and manual acceptance. |
| TDD/issues | `docs/03-engineering/tdd-policy.md`, `docs/03-engineering/slc-tdd-issue-map.md`, `docs/03-engineering/issue-writing-rules.md` | Use when writing or implementing issue slices. |
| Legacy schedule audit | `docs/03-engineering/legacy-schedule-lane-audit.md` | Background for `schedule_items` compatibility while canonical care cards mature. |
| Reminder dispatch | `docs/03-engineering/reminder-dispatch-sop.md` | Use before touching reminder delivery or PWA push flows. |
| Design direction | `docs/02-design/designer-brief.md`, `docs/02-design/deck.md`, `docs/02-design/ux-usefulness-reset.md` | Visual and UX direction; not raw production asset requirements. |

## Active migration / epic references

| Topic | Current status | Read before touching |
|---|---|---|
| Care action migration (#440) | `main` includes through PR #445 at `5ac0f2149fc7d809d006adb070882e8793cedcac`. PR #447 / Slice 5 is pending unless GitHub shows it merged after this docs branch. | Current GitHub issue/PR, `src/domain/care-action-home-projection.ts`, `src/features/today/home-page-loader.tsx`, schedule/calendar/partner tests. |
| Canonical care cards | `care_action_cards` is the preferred read model for confirmed care actions. | `docs/specs/spec-care-action-cards.md`, `docs/04-decisions/0013-confirm-spine-canonical.md`, current issue/PR tests. |
| Legacy schedule fallback | `schedule_items` remains compatibility fallback where supported writers still depend on it. | `docs/03-engineering/legacy-schedule-lane-audit.md`, schedule route/page tests, active migration issue. |
| Partner projection | Partner is support-only and sanitized. | `docs/specs/spec-partner-access.md`, `docs/wiki/05-partner-projection.md`, partner service/tests. |
| Result Protection Mode | Emotional safety mode around sensitive result states. | `docs/04-decisions/0012-result-protection-mode.md`, result-protection domain/tests if present. |

## Historical/background documents

These may explain why the product changed, but they should not override current product specs or active GitHub issues.

| Historical bucket | Examples | Guidance |
|---|---|---|
| Earlier PRDs and SLC/MVP notes | `docs/01-product/mvp-target.md`, older root/workspace PRDs if present outside this app repo | Use for context only. Prefer `prd-v1.0.md` for current requirements. |
| Design exploration and visual assets | `docs/02-design/assets/`, `docs/design/`, `docs/02-design/benchmarks/` | Reference for visual direction; do not copy raw assets into production without a current design issue. |
| Homework/progress logs | `docs/06-hw/`, `progress.txt`, `assignments/` | Historical work logs, not acceptance criteria. |
| LLM/agent notes | `llm-wiki/`, `CODEX_1SHOT.md`, `CODEX_SLC.md`, `CLAUDE.md` | Useful for agent context; not the human-facing source of truth. |
| Archived or candidate docs | Anything later listed under `docs/archive/README.md` | Background only unless a current issue explicitly reactivates it. |

## Recommended reading order before coding

1. `README.md` — 60-second product/app map and quickstart.
2. This file — identify canonical vs historical docs.
3. `docs/01-product/original-note-hyunjoo.md` — user pain and empathy context.
4. `docs/01-product/prd-v1.0.md` — current product decisions.
5. `docs/01-product/slc-target.md` — current release gate.
6. The active GitHub issue and linked PRs.
7. Relevant ADRs in `docs/04-decisions/`.
8. Relevant implementation guide in `docs/03-engineering/`.
9. Existing code and tests for the touched surface.

## What not to touch casually

- Do not weaken the patient/prospective mother flow to simplify partner or demo behavior.
- Do not treat partner as a second primary user. Partner is a support surface.
- Do not remove `schedule_items` fallback during active #440 migration unless a dedicated slice proves it is safe.
- Do not add direct `care_action_cards` producer inserts from `/add` or `/clinic-update`.
- Do not expose raw clinic text or hidden patient context to partner surfaces.
- Do not rename core concepts without mapping. `split_candidates` is the canonical split draft term; do not reintroduce runtime `care_action_candidates`.
- Do not mass-move legacy folders in a feature PR. Add archive guidance first, then move files in a clearly scoped archive PR.
