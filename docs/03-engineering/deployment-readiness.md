# Deployment readiness

Last updated: 2026-05-11 KST.

This page separates repo-owned build health from external deployment-lane configuration. It is also the canonical place to decide whether a deployment problem blocks product work.

## Repo-owned Green checks

A branch is repo-ready when these commands pass locally and in GitHub Actions:

```bash
npm ci
npm run test
npm run typecheck
npm run build
```

Use Playwright for flow evidence when the changed slice touches navigation, auth redirects, capture/confirm, partner view, or presentation mode:

```bash
npm run test:e2e
```

## Current deployment lanes

| Lane | Vercel target | Purpose | Backend mode | Current status |
|---|---|---|---|---|
| Real SLC validation | `ckiwon7-6820s-projects/fevio` | Product-like Auth, Supabase, RLS, Capture, Confirm, Partner, Reminder QA | Supabase remote project | Green for build/deploy; public alias `https://project-oznp0.vercel.app` verified |
| Team presentation | Andy-owned Vercel project | Stable team presentation without backend setup risk | Backendless presentation mode | Use `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1`; Supabase env not required |

One codebase serves both lanes. Do not fork product logic for presentation; use the explicit env flag only.

## Real SLC lane contract

Required external configuration:

- Supabase project ref: `awetgcuczwdytctwfyjl`.
- Supabase migrations applied remotely.
- Vercel env includes Supabase public URL, anon key, service role where server routes require it, `NEXT_PUBLIC_APP_URL`, and privacy contact email.
- Supabase Auth has Google OAuth configured in the dashboard.
- Supabase Auth redirects include the active production callback URL, currently `https://project-oznp0.vercel.app/auth/callback`, plus local callback when needed.

Verification commands:

```bash
curl -I https://project-oznp0.vercel.app
curl -I https://project-oznp0.vercel.app/privacy
curl -I https://project-oznp0.vercel.app/auth/sign-in
```

Expected:

- `/` and `/privacy` return `200`.
- `/auth/sign-in` redirects to Supabase authorize and uses the configured app callback.

## Presentation lane contract

Andy-owned Vercel can run without Supabase or Google OAuth by setting:

```env
NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1
NEXT_PUBLIC_APP_URL=<Andy presentation URL>
```

In this mode:

- `/auth/sign-in` redirects to Privacy Gate instead of starting Google OAuth.
- Privacy acceptance sets a demo cookie.
- Capture/Confirm uses the demo store and does not write sensitive data.
- This lane is for presentation stability only; it is not SLC release evidence for Auth/RLS/backend writes.

## Secret handling

Never commit raw values from local files under `env/`, `.env.local`, Vercel pulls, Supabase dashboard exports, Google OAuth credentials, or provider keys.

Local known secret files are intentionally gitignored, including:

- `env/supabase_secret.txt`
- `env/google_oAuth.txt`
- `env/supabase_db_url.txt`
- `.env.local`

If a client secret or service key is printed in a terminal, chat, screenshot, CI log, or PR comment, rotate it at the provider and update the relevant dashboard before relying on it.

## Non-blockers

- `supabase gen types typescript --db-url ...` is not required for the current SLC because generated DB types are not imported by the app. Add generated types later as a quality improvement when Docker or API-based generation is available.
- Vercel Git-connected preview gaps on an owner-split project do not block real SLC work as long as manual production/preview deployments and repo checks are green.


## Current next action order

1. `#74` iOS Frame — fast CSS/layout visual polish for desktop presentation review.
2. `#75` Brand Identity — requires source logo/icon/OG assets or an approved generation concept; implementation can wire assets and metadata.
3. `#52` Reminder Minimum — requires Resend/API provider key and scheduler setup for full green.
4. `#56` SLC manual QA checklist — run last, after the above are merged or scoped out.

## Required Green evidence before SLC release

- Repo checks green.
- Real SLC lane opens on mobile viewport.
- Google OAuth login succeeds through Supabase.
- Privacy Gate blocks sensitive writes until accepted.
- Capture → Split Review → Confirm creates persisted care cards.
- Dynamic Home reflects confirmed cards.
- Partner link returns sanitized server-filtered payload.
- Presentation polish issues `#74` and `#75` are merged or explicitly scoped out for the release demo.
- Remaining P0 `#52` is closed or explicitly scoped out with issue comments.
- `#56` manual QA evidence is attached after real SLC and presentation lane smoke checks.
