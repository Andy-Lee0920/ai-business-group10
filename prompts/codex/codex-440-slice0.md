You are working in the Fevio repo.

Goal: implement Slice 0 of GitHub issue #440 only.

Parent context:
- #433 locked the Fevio product spine:
  post-visit clinic logging → confirmed care actions → today execution → partner-safe behavior prompts
- #440 is the migration epic for manual logging write bridge.
- ADR 0028 is accepted and must be followed.
- Do not relitigate ADR 0028 decisions.

Task:
Extract a shared canonical care-action writer so that all existing care_action_cards inserts go through one shared service/helper.

Current problem:
care_action_cards inserts are scattered across exactly these three sites:
- app/api/onboard/candidates/confirm/route.ts
- app/api/schedule/complete/route.ts
- src/lib/sensitive-care-write.ts

This creates parallel write paths. Before adding manual logging bridges, we need one shared canonical writer.

Scope for this task:
1. Inspect existing care_action_cards insert sites.
2. Identify the common fields, validation assumptions, provenance/audit requirements, and differences between the insert sites.
3. Create a shared canonical writer module/service for care_action_cards creation.
4. Refactor the existing insert sites to call the shared writer.
5. Preserve existing behavior.
6. Do not implement Slice 1–5 yet.
7. Do not change partner read source yet.
8. Do not migrate calendar/schedule API yet.
9. Do not add structured manual confirm yet.
10. Do not introduce any new direct care_action_cards insert path.

Important invariants:
- care_action_cards remains the canonical confirmed-action table.
- schedule_items is not canonical; do not make new features write schedule_items as the primary meaning source.
- confirmation-first must be preserved.
- duplicate confirm must not create duplicate executable care_action_cards.
- partner-visible data must still go through the existing projection/sanitization layer.
- Do not add free-text partner_prompt.
- Do not bypass existing privacy/RLS/sensitive-write rules.
- No placeholder hardcoded phase/day values.

Files to read first:
- docs/04-decisions/0028-manual-logging-write-bridge-producer-first.md
- docs/specs/spec-manual-logging-write-bridge-migration.md
- CONTEXT.md
- app/api/onboard/candidates/confirm/route.ts
- app/api/schedule/complete/route.ts
- src/lib/sensitive-care-write.ts
- src/lib/capture-confirm-store.ts
- src/domain/partner-role-projection.ts
- src/services/partner-view.ts
- supabase/migrations/202605100002_care_action_cards.sql
- supabase/migrations/202605100003_capture_confirm.sql

Deliverables:
- Shared canonical care-action writer module/helper.
- Existing three insert sites refactored to use it.
- Tests proving existing flows still pass.
- If no suitable tests exist, add focused regression tests around:
  - candidate confirm creates care_action_cards through the shared writer
  - schedule complete path still behaves as before through the shared writer
  - sensitive care write still preserves privacy/audit behavior through the shared writer
  - duplicate confirm does not create duplicate care_action_cards, if this is currently covered or feasible
- Update docs only if needed to reference the new shared writer location.
- Commit changes on a new branch.

Suggested branch:
fix/440-slice-0-shared-care-action-writer

Acceptance criteria:
- There is exactly one shared service/helper responsible for care_action_cards creation.
- Existing routes/services no longer hand-roll direct care_action_cards inserts.
- No new manual logging bridge is implemented yet.
- Existing tests pass.
- New/updated tests verify the refactor.
- git diff shows behavior-preserving refactor, not scope expansion.
- PR body links #440 and says this implements Slice 0 only.

Before finishing:
- Run the repo's relevant test commands: `npm run test`, `npm run typecheck`, `npm run build`.
- Report exact commands and results.
- Summarize changed files.
- Clearly list any follow-up blockers for Slice 1.
