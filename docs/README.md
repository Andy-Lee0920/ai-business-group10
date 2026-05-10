# Fevio [페비오] Documentation Map

Use this page as the first stop after `README.md`. It is a navigation interface for contributors and coding agents; it is not a progress dashboard.

## Directory contract

| Directory | Purpose | Read when... |
|---|---|---|
| `docs/01-product/` | Product source of truth: SLC, PRD, original note | deciding what Fevio must become |
| `docs/02-design/` | Design direction, deck, curated visual assets | preparing UI, copy, or design tokens |
| `docs/03-engineering/` | Issue grammar, TDD map, schema/RLS contract, specs | implementing or reviewing an issue |
| `docs/04-decisions/` | Durable ADR-style decisions | checking why a direction is fixed |
| `docs/05-contribution/` | Contribution workflow notes | using specctl or onboarding collaborators |

## Fast path by role

| If you are... | Start here | Then read |
|---|---|---|
| New contributor | `README.md` | `CONTRIBUTING.md` |
| Product/PM reviewer | `docs/01-product/original-note-hyunjoo.md` | `docs/01-product/prd-v1.0.md` → `docs/01-product/slc-target.md` |
| Designer | `docs/02-design/designer-brief.md` | `docs/02-design/deck.md` |
| Engineer/agent starting #32+ | relevant GitHub issue | `docs/03-engineering/slc-tdd-issue-map.md` |
| Engineer/agent starting overnight batch | `docs/03-engineering/overnight-batch-runbook.md` | `docs/03-engineering/deployment-readiness.md` → active issue |
| Security/RLS reviewer | `docs/03-engineering/schema-rls-matrix.md` | relevant migration/spec once app code exists |
| Issue author | `docs/03-engineering/issue-writing-rules.md` | `.github/ISSUE_TEMPLATE/slc-contribution.md` |

## Source hierarchy

When documents disagree, prefer this order:

1. `docs/01-product/original-note-hyunjoo.md` for originating user pain and long-term product axes
2. GitHub issue/spec for the active slice, as long as it does not erase that original product meaning
3. `docs/01-product/slc-target.md` for the current release gate
4. `docs/01-product/prd-v1.0.md` for implementation decisions
5. `docs/04-decisions/`
6. `CONTEXT.md`
7. `AGENTS.md` / `CLAUDE.md`

## Canonical documents

### Product

- `docs/01-product/README.md` — product document reading guide.
- `docs/01-product/original-note-hyunjoo.md` — original problem framing and long-term product axes.
- `docs/01-product/prd-v1.0.md` — PRD v1.0 implementation source.
- `docs/01-product/slc-target.md` — final SLC release gate.

### Design

- `docs/02-design/designer-brief.md` — do/don't guidance for Fevio visual direction.
- `docs/02-design/deck.md` — reference deck notes.
- `docs/02-design/assets/` — curated deck images that may be referenced by docs.

### Engineering

- `docs/03-engineering/issue-writing-rules.md` — Korean-first issue grammar for non-developer contributors.
- `docs/03-engineering/slc-tdd-issue-map.md` — how SLC, TDD, and issues fit together.
- `docs/03-engineering/schema-rls-matrix.md` — minimum Supabase schema/RLS contract.
- `docs/03-engineering/deployment-readiness.md` — real SLC vs backendless presentation deployment contracts.
- `docs/03-engineering/overnight-batch-runbook.md` — current overnight batch preflight, lane split, and remaining P0 order.
- `docs/03-engineering/slc-release-gate-checklist.md` — draft manual QA evidence template for #56.
- `docs/specs/issue-32-app-scaffold-vercel-supabase-foundation.md` — first app scaffold spec.

### Decisions and contribution

- `docs/04-decisions/0001-slc-first-manual-first.md` — SLC-first, manual-first, Vercel/Supabase split.
- `docs/05-contribution/specctl-by-junhyun.md` — preserved note about JunHyun's specctl-based contribution flow.
- `CONTRIBUTING.md` — canonical contribution guide.

## Local-only generated files

Do not store raw generated ideation images directly in product/docs folders. Keep only curated assets in `docs/02-design/assets/`. Local scratch artifacts belong outside git, for example under ignored `.local-artifacts/`.

## What not to use this page for

Do not track implementation progress here. Use GitHub issues, PRs, and specs for progress. Keep this page stable enough that agents can use it as a navigation seam.
