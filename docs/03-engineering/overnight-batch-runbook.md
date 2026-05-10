# Overnight batch runbook

Last updated: 2026-05-11 KST.

This runbook captures the current operating split for Fevio overnight work. It intentionally records **state and commands only**; never paste raw secrets into this file.

## Deployment lanes

Fevio now runs one codebase against two deployment lanes.

| Lane | Owner / target | Purpose | Backend | Required env shape |
|---|---|---|---|---|
| Real SLC validation | `ckiwon7-6820s-projects/fevio` | Verify production-like Auth, Privacy Gate, Capture, Confirm, Partner, Reminder behavior | Supabase remote project | Supabase public URL/anon key, service role where needed, `NEXT_PUBLIC_APP_URL`, provider secrets in dashboards |
| Team presentation | Andy-owned Vercel project | Stable team demo and presentation flow | Backendless presentation mode | `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1`, `NEXT_PUBLIC_APP_URL=<Andy demo URL>` |

Rules:

- Keep both lanes on the same `main` branch unless a temporary release branch is explicitly needed.
- The real SLC lane is the source of truth for data, RLS, OAuth, and reminder behavior.
- The presentation lane must be safe to show without Supabase, Google OAuth, or write-capable backend secrets.
- Presentation mode is not a substitute for SLC acceptance evidence.

## Current external configuration status

As of 2026-05-11 KST:

- Supabase remote migrations have been pushed to project ref `awetgcuczwdytctwfyjl`.
- The real SLC Vercel deployment is linked to `ckiwon7-6820s-projects/fevio`.
- Public production alias verified: `https://project-oznp0.vercel.app`.
- Supabase Google OAuth credentials were obtained from Google and applied in Supabase Auth settings.
- Local credential export file exists at `env/google_oAuth.txt`; it is ignored by git and must remain local-only.
- `supabase gen types typescript` is not an SLC blocker. Generated DB types can be added later when Docker or Supabase API generation is available.

Security note: if any OAuth client secret is displayed in terminal, chat, CI logs, or screenshots, rotate that secret in Google Cloud and update Supabase Auth with the new value.

## Overnight preflight

Run from repo root:

```bash
git checkout main
git pull origin main
npm ci
npm run typecheck
npm run test
npm run build
```

Remote sanity checks for the real SLC lane:

```bash
curl -I https://project-oznp0.vercel.app
curl -I https://project-oznp0.vercel.app/privacy
curl -I https://project-oznp0.vercel.app/auth/sign-in
```

Expected:

- `/` and `/privacy` return `200`.
- `/auth/sign-in` redirects to the Supabase authorize URL and includes `/auth/callback` in `redirect_to`.

Do not print env values. Use `vercel env ls`, Supabase dashboard, or redacted key-presence checks only.

## Open overnight batch candidates

Core P0 merged/closed: `#23`, `#24`, `#25`, `#26`, `#27`, `#34`, `#53`, `#54`, `#55`, `#58`, `#59`, `#61`, `#68`, `#69`.

Current next-work order after the 2026-05-11 overnight merges:

1. `#74` iOS Frame
   - Scope: desktop/tablet presentation frame around the mobile app viewport.
   - Dependency: none beyond the merged #68 app shell.
   - Why now: highest visual payoff before team presentation; CSS/layout-only and quick to verify.
2. `#75` Brand Identity
   - Scope: logo/app icon/OG image/metadata wiring.
   - Dependency: brand asset direction or generated/approved source assets.
   - Why next: presentation impression remains weak without a visible Fevio mark.
   - Agent can wire assets into `public/`, metadata, manifest, and e2e checks; original PNG/SVG generation needs an approved concept or supplied assets.
3. `#52` Reminder Minimum
   - Scope: email-only reminder path from ADR 0004 plus any remaining in-app reminder checks.
   - Dependency: Resend/API provider key and scheduler/cron setup for full green.
   - Why after visual polish: SLC safety feature, but external email credentials can block completion.
4. `#56` SLC manual QA checklist
   - Scope: final real SLC + presentation lane evidence.
   - Dependency: run after `#74`, `#75`, and `#52` are merged or explicitly scoped out.
5. `#57` Vercel Preview SOP
   - Scope: document owner-split Vercel reality and both deployment lanes.
   - Can be done anytime, but best after the current presentation/real-lane deployment pattern stabilizes.

Google OAuth status:

- `/auth/sign-in` redirects to Supabase authorize with `redirect_to=https://project-oznp0.vercel.app/auth/callback`.
- ckiwon Vercel production/development env now includes `NEXT_PUBLIC_APP_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Full Google account login remains a manual QA item for `#56`, not a code blocker.

## Batch execution constraints

- No LLM may decide `card_type`, `safety_level`, treatment strategy, dosage, diagnosis, or success probability.
- `display_safety_level` remains UI-only and must not become a persisted medical judgment column.
- Sensitive writes require accepted Privacy Gate in real SLC mode.
- Presentation mode may simulate flow but must not write sensitive data.
- Keep PRs small and issue-scoped. If a blocker appears, skip the issue and report it.

## Report format

```text
STEP N — #issue [done/blocker]
PR: <url or none>
Lane validated: real SLC / presentation / both
Tests: <summary>
npm run typecheck: ✅/❌
npm run test: ✅/❌
npm run build: ✅/❌
Remaining Red: none / details
Secrets touched: no raw values printed / rotation required
```
