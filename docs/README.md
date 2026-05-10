# Fevio [페비오] Documentation Map

Use this page as the first stop after `README.md`. It is a navigation interface for contributors and coding agents; it is not a progress dashboard.

## Fast path by role

| If you are... | Start here | Then read |
|---|---|---|
| New contributor | `README.md` | `CONTRIBUTING.md` |
| Product/PM reviewer | `docs/01_product_requirements/SLC target/SLC target.md` | `docs/01_product_requirements/fertility-support-prd-v1.0.md` |
| Designer | `docs/03_design_guidance/designer-brief.md` | `docs/02_product_design_10/slides.md` |
| Engineer/agent starting #32 | `docs/specs/issue-32-app-scaffold-vercel-supabase-foundation.md` | `docs/02_engineering/slc-tdd-issue-map.md` |
| Security/RLS reviewer | `docs/schema-rls-matrix.md` | relevant migration/spec once app code exists |
| Issue author | `docs/02_engineering/issue-writing-rules.md` | `.github/ISSUE_TEMPLATE/slc-contribution.md` |

## Source hierarchy

When documents disagree, prefer this order:

1. GitHub issue/spec for the active slice, as long as it does not violate product invariants.
2. `docs/01_product_requirements/SLC target/SLC target.md`
3. `docs/01_product_requirements/fertility-support-prd-v1.0.md`
4. `docs/adr/`
5. `CONTEXT.md`
6. `AGENTS.md` / `CLAUDE.md`
7. Older background notes

## Durable decisions

- `docs/adr/0001-slc-first-manual-first.md` — SLC-first, manual-first, Vercel/Supabase split.

## Product requirement files

- `docs/01_product_requirements/SLC target/SLC target.md` — final SLC release gate.
- `docs/01_product_requirements/fertility-support-prd-v1.0.md` — PRD v1.0 implementation source.
- `docs/01_product_requirements/fertility-support-original (by Hyunjoo).md` — original/background product note.

## Engineering files

- `docs/specs/issue-32-app-scaffold-vercel-supabase-foundation.md` — first app scaffold spec.
- `docs/02_engineering/slc-tdd-issue-map.md` — how SLC, TDD, and issues fit together.
- `docs/02_engineering/issue-writing-rules.md` — Korean-first issue grammar for non-developer contributors.
- `docs/schema-rls-matrix.md` — minimum Supabase schema/RLS contract.

## Design files

- `docs/03_design_guidance/designer-brief.md` — do/don't guidance for Fevio visual direction.
- `docs/02_product_design_10/slides.md` — design asset reference deck and slide notes.
- `docs/02_product_design_10/assets/` — referenced design slide images.

## Contribution files

- `CONTRIBUTING.md` — canonical contribution guide.
- `docs/contribution-by-specctl-skill-junhyun.md` — preserved note about JunHyun's specctl-based contribution flow.
- `.github/ISSUE_TEMPLATE/slc-contribution.md` — GitHub issue template.

## What not to use this page for

Do not track implementation progress here. Use GitHub issues, PRs, and specs for progress. Keep this page stable enough that agents can use it as a navigation seam.
