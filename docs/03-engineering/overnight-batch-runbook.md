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

Core P0 already merged/closed: `#23`, `#24`, `#25`, `#26`, `#27`, `#34`, `#53`, `#55`, `#58`, `#59`.

Remaining high-value batch order:

1. `#54` Description Guide
   - Scope: content rule, hint, forbidden medical-judgment phrase detection.
   - Backend dependency: none.
   - Good for presentation and real SLC lanes.
2. `#61` Partner revoke UI
   - Scope: revoke button/status path for existing partner share link model.
   - Backend dependency: Supabase schema already exists; use real SLC lane for validation.
3. `#52` Reminder Minimum
   - Scope: in-app critical card emphasis is already available; email dispatch/logging remains.
   - Backend dependency: transactional email provider key and scheduled-function/cron decision.
   - Do not block UI-only work on email provider setup.
4. `#56` SLC manual QA checklist
   - Scope: manual QA evidence for real SLC lane plus backendless presentation lane smoke path.
5. `#57` Vercel Preview SOP
   - Scope: document how to validate both lanes when Git-connected preview is unavailable or owner-split.

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
