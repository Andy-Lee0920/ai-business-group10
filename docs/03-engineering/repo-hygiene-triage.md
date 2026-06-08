# Fevio repo hygiene triage — README and stale GitHub work items

Date: 2026-06-08
Repo: `Andy-Lee0920/ai-business-group10`
Base inspected: `origin/main` at `fb7bfc0` after PR #447, #448, and #451 were merged.
Scope: docs and GitHub triage only. No app code, schema, RLS, route behavior, migration behavior, or `schedule_items` fallback behavior changed.

## Executive recommendation

Use README as a first-time developer entrypoint only. Keep current work status in GitHub issues/PRs, and keep long-lived decisions in `docs/SPEC_INDEX.md`, `docs/01-product/`, `docs/03-engineering/`, or ADRs.

Recommended order after this docs-only PR:

1. Review this README slim + triage artifact.
2. Close or update stale GitHub items with explicit comments, starting with superseded internal items.
3. Keep external contributor PRs open for maintainer review unless the author is asked to rebase/scope or convert the work into an issue/spec.
4. Do not remove `schedule_items` fallback paths without a dedicated proof slice.

## Current settled PR baseline

| PR | Current status | Hygiene impact |
|---|---:|---|
| #447 `fix: complete care action migration regression sweep` | merged at `0390e96` | Migration regression sweep is now part of main. |
| #448 `docs: add Fevio onboarding map and canonical spec guide` | merged at `ca6e978` | `docs/SPEC_INDEX.md` exists and should absorb spec-map detail from README. |
| #451 `refactor: make partner care-card boundary explicit` | merged at `fb7bfc0` | Partner privacy boundary is explicit on main. README should not carry PR-stage caveats for it. |

## README audit

| README content type | Before this pass | Decision |
|---|---|---|
| First-time developer intro | Product identity and user framing were useful but duplicated in multiple sections. | Keep and compress. |
| Active app path | Present indirectly through deployment lane and implementation tables. | Keep as one stable path map. |
| Quickstart | Present. | Keep. |
| Source-of-truth docs | Present but mixed with status/history. | Keep as canonical reading order. |
| Safety invariants | Present. | Keep and tighten around partner privacy, confirmation-first, canonical cards, and legacy fallback caution. |
| Deployment lanes | Long live dashboard with URLs and lane status. | Remove from README; use deploy/readiness runbooks and GitHub evidence. |
| 7-stage demo architecture | Detailed stage table and file map. | Remove from README; keep demo docs/specs separate. |
| Implemented flow table | Long implementation map. | Remove from README; use `docs/SPEC_INDEX.md`, `docs/README.md`, code search, and active issues. |
| Current work status / migration context | README explicitly warned not to use it as dashboard but still carried current migration narrative. | Remove from README; GitHub issues/PRs are source of truth. |
| Validation criteria | Mixed routine commands with demo/live QA details. | Keep only basic local commands; link runbooks for deploy/live smoke. |

## README slim structure applied

The README now contains:

1. What Fevio is.
2. Primary user and partner role.
3. Product one-liner and stable values.
4. Active app path and key routes.
5. Quickstart and basic validation commands.
6. Source-of-truth docs and GitHub links for current work.
7. Safety invariants.
8. Repository hygiene rule.
9. Secret policy.

Removed from README:

- detailed deployment lane dashboard;
- 7-stage demo architecture table;
- long implemented-flow table;
- current migration/work-status narrative;
- demo-specific validation checklist.

## Open PR triage

| PR | Head | State on 2026-06-08 | Classification | Recommendation |
|---|---|---|---|---|
| #430 `feat(push): #424 failure + re-subscribe CTA` | `feat/424-push-failure` | draft, dirty against current main; historical checks were green | `needs-owner-decision` | Rebase or close as stale. If kept, refresh against latest main and re-run CI/live-device gap note. Do not merge from old draft state. |
| #429 `feat(confirm): #425 side-by-side` | `feat/425-confirm-ui` | draft, clean; historical checks green | `merge/review-next` | Candidate for maintainer review after checking overlap with current confirm/care-card work. Convert from draft only after a fresh preview/CI check. |
| #420 `feat(trust): 원문 확인` | `Dongkyun` | external contributor, dirty, CI/Vercel failing | `external-contributor-review-needed` | Do not close abruptly. Comment that current baseline changed and ask for rebase/scope or conversion into a smaller source-evidence issue. |
| #417 `배아 이식 후 기다림 감성 케어 AI 스펙` | `Hyunjoo` | external contributor, unstable, CI/Vercel failing | `external-contributor-review-needed` | Treat as product/spec input. Ask whether to convert to `docs/01-product` or a GitHub issue before code/spec merge. |

## Open issue triage

| Issue | Current read | Classification | Recommendation |
|---|---|---|---|
| #377 PWA manifest / SW / push infra | Older parent; #421 was created as a closure slice and has evidence comments. | `superseded-by #421` | Close after comment if maintainer accepts #421 as the replacement tracking issue. |
| #380 pg_cron scheduler | Older parent; #422 was created as a closure slice and has evidence comments. | `superseded-by #422` | Close after comment if maintainer accepts #422 as the replacement tracking issue. |
| #382 Android live PWA reminder smoke | Still represents physical Android device evidence gap. | `keep-active` | Keep until a real Android smoke comment provides URL/role/action/result and device evidence. |
| #383 iOS Home Screen PWA smoke | Still represents physical iOS/Home Screen evidence gap. | `keep-active` | Keep until real iOS Home Screen PWA evidence exists. |
| #405 schedule writes migration | Older migration follow-up; #440 and merged PRs addressed much of the producer/canonical-card work. | `needs-owner-decision` | Audit current main and either close as covered by #440 slices or rewrite as the remaining producer-only gap. |
| #406 schedule readers migration | Older migration follow-up; #440 and merged PRs addressed readers, but fallback remains intentionally cautious. | `needs-owner-decision` | Do not close merely because tests pass. Close only after confirming the intended compatibility fallback state is accepted. |
| #407 service-role audited helper | Separate security cleanup; no clear superseding PR in this pass. | `keep-active` | Keep active unless a dedicated service-role audit PR exists. |
| #421 PWA permission UI closure slice | Child/replacement for #377; PR #427 is merged and the issue was reopened for human acceptance. | `close-after-comment` | Review PR #427 evidence, then close #421 and #377 together if live-device gaps remain separately in #382/#383. |
| #422 scheduler closure slice | Child/replacement for #380; PR #426 is merged and the issue was reopened for human acceptance. | `close-after-comment` | Review PR #426 evidence, then close #422 and #380 if physical push receipt remains tracked separately in #382/#383. |
| #423 split candidate offset / inline quote domain | Data-contract slice related to #425; PR #428 is merged. | `close-after-comment` | Close after confirming PR #428 satisfied the data-contract slice; keep #425/#429 for the UI consumer work. |
| #424 push failure handling | Has draft PR #430. | `merge/review-next` | Decide whether to rebase/finish #430 or close both as deferred. |
| #425 confirm UI side-by-side | Has draft PR #429. | `merge/review-next` | Fresh review after current main; likely the next actionable internal PR. |
| #433 repo legibility / safety refactors | Parent cleanup/refactor issue; spawned #440 and docs cleanup work. | `keep-active` | Keep as parent until explicit child issue mapping is complete. |
| #435 policy-support deployment gate | Separate production exposure decision. | `keep-active` | Keep until policy-support release mode is decided and live URL evidence is posted. |
| #436 GitHub ops cleanup | Branch cleanup partially happened, but deploy-readiness gate remains broader. | `keep-active` | Update with branch cleanup evidence; close only if deploy gate/branch cleanup acceptance is fully met. |
| #440 manual logging write bridge epic | PRs #441, #442, #443, #444, #445, #447, and #451 are merged on main. | `needs-owner-decision` | Consider closing after a maintainer reviews final main evidence and confirms no remaining #440 acceptance gap. |
| #446 repository spec/onboarding map | PR #448 merged the docs/spec map first pass. | `close-after-comment` | Close if #448 satisfies the first-pass docs-only objective; otherwise rewrite remaining asks as smaller follow-ups. |
| #449 open-source project basics | Current local user workspace has unmerged work, but main does not yet include it. | `keep-active` | Keep active until LICENSE, AI log guide, license docs, and README/SPEC_INDEX links merge. |

## Proposed close/supersede comments

Use these comments as starting points; do not close automatically from this document alone.

### #377

```text
Superseded for implementation tracking by #421, which narrows the remaining PWA permission UI / iOS non-installed behavior and preserves live-device closure in #382/#383.

Closing this parent to reduce stale queue if maintainers accept #421 as the active replacement. Live Android/iOS receipt evidence should remain tracked in #382/#383.
```

### #380

```text
Superseded for implementation tracking by #422, which narrows the pg_cron / CRON_SECRET / reminder_dispatches uniqueness closure work.

Closing this parent to reduce stale queue if maintainers accept #422 as the active replacement. Physical device push receipt remains tracked separately in #382/#383.
```

### #446

```text
First-pass docs-only onboarding/spec-map work landed via PR #448 and `docs/SPEC_INDEX.md` is now the canonical spec map entrypoint.

Closing this issue if the intended first pass is satisfied. Any remaining structural cleanup should be opened as smaller follow-up issues instead of keeping this broad diagnosis issue open.
```

### #405 / #406

```text
#440 and its merged slice PRs moved the care-action migration forward on main, but this older issue should not be closed from branch-only evidence or from tests alone.

Before closing, please confirm whether any remaining `/add`, `/clinic-update`, calendar, records, or schedule compatibility behavior is intentionally retained as legacy fallback. If yes, close this as superseded by #440 with the fallback explicitly documented; if no, rewrite this issue to the exact remaining path.
```

### #420 / #417

```text
Thank you for the contribution. The main branch has changed significantly around confirmed care cards, partner projection, and source-of-truth docs.

Before this can be reviewed safely, please rebase onto latest `main` and narrow the scope to one product decision or one URL-action-result. If the work is primarily product/spec direction, we can convert it into a GitHub issue or docs proposal instead of merging the current branch as-is.
```

## Risks and guardrails

- Do not close live-device push issues (#382/#383) from local or CI-only evidence.
- Do not close production-visible deployment issues without merged-main commit, deploy ID, and live smoke evidence.
- Do not merge draft PRs #429/#430 based only on their old green checks; refresh against current main first.
- Do not close external contributor PRs without a respectful rebase/scope path.
- Do not use README as a progress dashboard again.
- Do not remove `schedule_items` fallback paths during README/docs hygiene.

## Validation for this docs-only pass

Required:

```bash
git diff --check
```

Optional review:

```bash
wc -l README.md
```
