# SLC release-gate manual QA checklist

Status: draft for `#56`. Use this as the manual QA evidence template; completing this file does not close `#56` until the issue/PR records real run evidence.

## Lanes under test

| Lane | URL | Expected use |
|---|---|---|
| Real SLC | `https://project-oznp0.vercel.app` | Product acceptance with Supabase/Auth/backend writes |
| Presentation | Andy-owned Vercel URL | Backendless team demo with `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1` |

## Preflight

- [ ] `git checkout main && git pull origin main`
- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] No raw secrets printed in terminal, screenshots, PRs, issue comments, or docs.

## Real SLC lane

- [ ] `/` opens on mobile viewport.
- [ ] `/privacy` opens and shows deletion-request v1.x copy.
- [ ] `/auth/sign-in` redirects to Supabase Google authorize.
- [ ] Google OAuth completes and returns to `/auth/callback`.
- [ ] First authenticated user gets couple shell bootstrap.
- [ ] Privacy Gate reject path returns without sensitive write.
- [ ] Privacy Gate accept path unlocks Capture.
- [ ] Capture stores raw visit memo and split draft only.
- [ ] Manual Split does not write classification before Confirm.
- [ ] Confirm creates `split_candidates` and `care_action_cards` atomically.
- [ ] Dynamic Home changes from onboarding to the correct care day.
- [ ] Critical injection card appears above other confirmed cards with text and visual emphasis.
- [ ] Partner share link exposes only whitelisted fields and no raw memo/token.
- [ ] Partner revoke UI/path works after `#61`.
- [ ] Email reminder path works after `#52`, or is explicitly scoped out for the QA run.

## Presentation lane

- [ ] Andy Vercel has `NEXT_PUBLIC_FEVIO_PRESENTATION_MODE=1`.
- [ ] No Supabase or Google OAuth secrets are required in Andy Vercel.
- [ ] `/auth/sign-in` routes to Privacy Gate instead of external OAuth.
- [ ] Privacy Gate accept sets demo flow cookie and opens Capture.
- [ ] Capture → Split Review → Confirm can be demonstrated without backend writes.
- [ ] UI copy makes it clear this is a safe product-flow demo, not medical advice.

## Evidence to attach to `#56`

- Final tested commit SHA.
- Real SLC URL and timestamp.
- Presentation URL and timestamp.
- Mobile viewport screenshots for root, Privacy, Capture, Split Review, Dynamic Home, Partner view.
- Any skipped gate with reason and owner.
- Confirmation that no secrets were printed or committed.
