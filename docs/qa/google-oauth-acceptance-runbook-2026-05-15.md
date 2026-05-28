# Google OAuth Production Acceptance Runbook — 2026-05-15

## Purpose

Issue #267 already has production deploy evidence, Supabase migration evidence, and a 12/12 production Supabase-authenticated data-loop run. The only remaining acceptance gap is **Patient Google Login 성공** with a live Google account.

Use this runbook to capture the missing URL-action-result evidence without changing app code.

## Target

- Production alias: https://project-oznp0.vercel.app
- Latest production deployment at time of runbook creation: `dpl_AbgydSEwB3KNSFPEDFGQEmD4DQXb`
- Supabase project ref: `awetgcuczwdytctwfyjl`

## Preconditions

- Use a disposable Google test account, not a personal account.
- Browser profile/incognito session has no prior Fevio/Supabase session cookies.
- If privacy gate appears, accept it before starting Google OAuth.

## Steps and required evidence

| Step | Action | Expected result | Evidence to attach to #267 |
| --- | --- | --- | --- |
| 1 | Open `https://project-oznp0.vercel.app/` | Landing page loads with Google CTA | Screenshot of landing/root page and timestamp |
| 2 | Click Google CTA or open `/auth/sign-in` after privacy gate | Browser redirects to Google account chooser/consent through Supabase authorize URL | Screenshot or HAR showing `accounts.google.com/o/oauth2/v2/auth` |
| 3 | Complete Google login with disposable account | Browser returns to `https://project-oznp0.vercel.app/auth/callback` then app route | Screenshot after callback redirect |
| 4 | If first login, complete onboarding consent + patient role | User reaches `/home` or `/onboarding` flow without auth error | Screenshot of resulting app screen |
| 5 | Confirm Supabase user exists | Supabase Auth user has Google identity/provider metadata | Redacted screenshot from Supabase dashboard or admin query result, hiding email if needed |
| 6 | Confirm app session works | Reload `/home`; user stays authenticated | Screenshot after reload |

## Minimal pass criteria

The Google OAuth part of #267 can be closed only when the evidence shows all of the following:

1. The production app starts Google OAuth from `project-oznp0.vercel.app`.
2. Google account chooser/consent is reached.
3. A real Google account completes login and returns through `/auth/callback`.
4. The app establishes an authenticated session after callback.
5. A reload of `/home` remains authenticated.

## Evidence comment template

```md
Google OAuth production acceptance evidence for #267:

- Target: https://project-oznp0.vercel.app
- Deployment: dpl_AbgydSEwB3KNSFPEDFGQEmD4DQXb or later
- Browser/session: <incognito/profile name, timestamp>
- Test account: <redacted disposable Google account>

Results:
1. Root/CTA loaded: pass — <screenshot/link>
2. Google OAuth chooser reached: pass — <screenshot/HAR/link>
3. `/auth/callback` returned to app: pass — <screenshot/link>
4. App authenticated session established: pass — <screenshot/link>
5. `/home` reload stayed authenticated: pass — <screenshot/link>
6. Supabase Auth Google identity exists: pass — <redacted screenshot/query evidence>

Conclusion: Patient Google Login 성공 verified on production.
```

## Current known non-credential evidence

Collected on 2026-05-15 without a live Google account:

- `GET https://project-oznp0.vercel.app/auth/sign-in` with `fevio_privacy_gate_v1=accepted` returns `307` to Supabase authorize with `provider=google`, `redirect_to=https://project-oznp0.vercel.app/auth/callback`, and `prompt=select_account`.
- Supabase authorize redirects to `https://accounts.google.com/o/oauth2/v2/auth...`.
- This proves OAuth initiation/wiring, but not login success.
