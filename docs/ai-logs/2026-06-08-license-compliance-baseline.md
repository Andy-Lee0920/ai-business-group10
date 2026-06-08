# AI contribution log — license/compliance baseline

Date: 2026-06-08
Human owner: ReliOptic
Scope: #449 docs/compliance baseline for Apache-2.0 license, AI log guidance, and dependency notice docs.

## AI-assisted work

- Drafted the Apache-2.0 repository license addition.
- Drafted AI contribution log guidance and this first baseline log.
- Extracted direct dependency version/license fields from `package.json` and `package-lock.json`.
- Added short README and `docs/SPEC_INDEX.md` links to the new compliance entrypoints.

## Human verification

- License choice proceeded from the owner direction to continue and the existing local Apache-2.0 workspace evidence.
- The change was constrained to docs/compliance and README contract coverage.
- Validation commands run locally:
  - `npm run test -- tests/unit/readme-contract.test.ts`
  - `npm run test`
  - `npm run typecheck -- --pretty false`
  - `npm run build`
  - `git diff --check`

## Safety/privacy review

- Patient/primary-user impact: none; no product behavior changed.
- Partner privacy impact: none; no partner surface changed.
- Raw clinical text exposure risk: none; no user data or clinical examples added.
- Schema/RLS/service-role impact: none; no app, database, or server code changed.

## Known gaps

- This is a direct-dependency notice baseline, not a full transitive dependency legal audit.
- Maintainers should refresh the dependency notice before public release packages or major dependency updates.
