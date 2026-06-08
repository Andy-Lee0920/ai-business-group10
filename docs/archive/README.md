# Archive guidance

This folder is the future home for historical Fevio planning, design, and work-log material. This PR intentionally adds guidance only; it does not mass-move legacy files.

## Why this exists

Fevio has many useful documents from product exploration, SLC/MVP planning, design benchmarking, AI-agent work logs, and presentation assets. They are valuable as background, but confusing when a first-time developer cannot tell whether they are current requirements.

Archive guidance prevents accidental scope drift:

- current implementation should follow `README.md`, `docs/SPEC_INDEX.md`, active GitHub issues, current product docs, and accepted ADRs;
- historical docs should explain context, not override current specs;
- moving files should happen in a separate, low-risk archive PR after links are checked.

## Historical/background buckets

| Bucket | Current examples | Treat as |
|---|---|---|
| Earlier PRD/MVP/SLC drafts | Older PRD files in parent workspace, `docs/01-product/mvp-target.md`, old issue maps | Product history unless reactivated by a current issue. |
| Design exploration | `docs/02-design/assets/`, `docs/design/`, `docs/02-design/benchmarks/` | Visual background and inspiration, not automatic production requirements. |
| Homework and work logs | `docs/06-hw/`, `progress.txt`, `assignments/` | Evidence/history, not current acceptance criteria. |
| Agent-only context | `llm-wiki/`, `CODEX_1SHOT.md`, `CODEX_SLC.md`, `CLAUDE.md` | Agent context; human developers should start from `README.md` and `docs/SPEC_INDEX.md`. |
| Presentation/demo artifacts | `/demo` docs, benchmark payloads, slide/deck assets | Demo context unless the active issue targets presentation mode. |

## Safe archive process

Before moving anything into `docs/archive/`:

1. Confirm the file is not linked as a canonical/current doc from `README.md`, `docs/SPEC_INDEX.md`, `docs/README.md`, or an active issue.
2. Preserve git history with `git mv`.
3. Update inbound links in the same PR.
4. Keep the archive PR docs-only unless the move breaks imports or tests.
5. Do not combine archive moves with app logic, schema, or migration behavior changes.

## Do not archive yet

Do not move these without a dedicated issue:

- `docs/01-product/original-note-hyunjoo.md`
- `docs/01-product/prd-v1.0.md`
- `docs/01-product/slc-target.md`
- `docs/01-product/fevio-product-north-star.md`
- `docs/03-engineering/schema-rls-matrix.md`
- `docs/04-decisions/`
- active issue specs under `docs/specs/`
- any file imported by app code or tests

## Follow-up issues suggested by #446

1. Archive legacy design/PRD assets safely.
2. Consolidate PRD versions into one canonical product spec.
3. Add a 10-minute local quickstart with seed data.
4. Add a contributor guide for human developers vs AI agents.
5. Later: code/module structure refactor only after docs stabilize.
