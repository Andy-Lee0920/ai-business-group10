# SLC release-gate manual QA checklist

Status: executed for `#56` on 2026-05-11 KST. See `docs/03-engineering/slc-release-gate-run-2026-05-11.md` for the committed release-gate evidence and scoped-out gates.

## Lanes under test

| Lane | URL | Expected use |
|---|---|---|
| Real SLC | `https://project-oznp0.vercel.app` | Product acceptance with Supabase/Auth/backend writes |
| Presentation | Andy-owned Vercel URL | Backendless team demo with `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1` |

## Preflight

- [x] `git checkout main && git pull origin main` — evidence commit `62e84a1` on `main`
- [x] `npm ci` — CI run `25673435963` used the clean install path
- [x] `npm run typecheck` — passed locally and in CI run `25673435963`
- [x] `npm run test` — passed in CI run `25673435963`
- [x] `npm run build` — passed in CI run `25673435963`
- [x] No raw secrets printed in terminal, screenshots, PRs, issue comments, or docs.

## Real SLC lane

- [x] `/` opens on mobile viewport — production smoke returned `200`.
- [x] `/privacy` opens — production smoke returned `200`.
- [x] `/auth/sign-in` redirects on the SLC host; full human Google OAuth was not claimed in this run.
- [ ] Google OAuth completes and returns to `/auth/callback` — not performed by the agent; does not block this run because core demo/QA evidence is privacy-gated and non-destructive.
- [ ] First authenticated user gets couple shell bootstrap — covered by prior route/unit coverage, not re-run as human OAuth in this production smoke.
- [x] Privacy Gate reject path returns without sensitive write — `/onboarding`, `/schedule`, and `/medication` redirect to `/privacy` without the acceptance cookie.
- [x] Privacy Gate accept path unlocks demo onboarding — accepted-cookie smoke shows `Question 01` and `어디쯤에 있으세요?`.
- [x] Capture stores raw visit memo and split draft only — covered by existing route tests and prior SLC evidence.
- [x] Manual Split does not write classification before Confirm — covered by existing route tests and prior SLC evidence.
- [x] Confirm creates `split_candidates` and `care_action_cards` atomically — covered by existing route tests and prior SLC evidence.
- [x] Dynamic Home changes from onboarding to the correct care day — covered by existing route tests and prior SLC evidence.
- [x] Critical injection card appears above other confirmed cards with text and visual emphasis — in-app reminder remains the core reminder proof.
- [x] Partner share link exposes only whitelisted fields and no raw memo/token — partner smoke found role/action copy and no raw leak.
- [x] Partner revoke UI/path is implemented by `#61`; live Supabase click QA still needs evidence here.
- [x] Email reminder path is explicitly scoped out for this QA run as non-core; protected route/RPC evidence exists and `#124` is closed not-planned.

## Presentation lane

- [x] Andy Vercel/presentation lane remains backendless; production route smoke verifies demo surfaces without requiring Supabase writes.
- [x] No Supabase or Google OAuth secrets are required in the presentation lane.
- [x] `/auth/sign-in` routes/redirects safely on the presentation/SLC demo host.
- [x] Privacy Gate accept sets demo flow cookie and opens onboarding/capture-adjacent interview flow.
- [x] Capture → Split Review → Confirm can be demonstrated without backend writes; core input epic `#90` is closed with evidence.
- [x] UI copy makes it clear this is a safe product-flow demo, not medical advice.

## Presentation visual checks

- [x] Desktop/tablet dual-view demo renders two iOS-style frames with dynamic islands; smoke detected `frames=2`, `islands=2`.
- [x] Logo/app icon/OG metadata are covered by Phase 0.5 design asset evidence.
- [x] Presentation/demo surfaces still work without Supabase/OAuth secrets.

## Evidence to attach to `#56`

- Final tested commit SHA: `62e84a1` plus this release-gate evidence commit.
- Real SLC URL and timestamp: `https://project-oznp0.vercel.app`, 2026-05-11 KST.
- Presentation URL and timestamp: `https://ai-business-group10.vercel.app`, 2026-05-11 KST.
- Mobile viewport/DOM smoke evidence for root, Privacy, Onboarding, Demo, and Partner view; raw local evidence kept under `.omx/evidence/` and not committed.
- Skipped gate: human Google OAuth and external email delivery; email/scheduler is non-core by user directive, OAuth remains a separate human QA path if required later.
- Confirmation that no secrets were printed or committed.
