# Vercel Preview SOP

Status: issue `#57` operating procedure. Use this for every PR that changes Fevio UI, routes, auth, data flow, or deployment configuration.

## Purpose

Preview review is not “the build passed.” A reviewer must open the deployed app, inspect the changed path in a mobile viewport, and leave evidence that another person can re-check.

This SOP uses the lane definitions in `docs/03-engineering/deployment-readiness.md`.

## Required PR evidence

Every PR should contain or receive a review comment with:

- Preview URL or production URL under test.
- Commit SHA under test.
- Mobile viewport used.
- Changed path(s) checked.
- Screenshot, short video, or exact metric when the change is visual.
- Any skipped check with reason and owner.

## Reviewer checklist

1. **Open the Vercel URL**
   - Confirm the URL loads with HTTP 200 or the expected redirect.
   - Confirm it is the Fevio app, not a stale project or wrong root directory.
2. **Use a mobile viewport**
   - Minimum desktop-browser check: iPhone-sized viewport.
   - For release-critical work, also test a real mobile browser when available.
3. **Check the changed path**
   - Open every route named in the PR description.
   - For visual work, inspect the exact component, spacing, scroll container, and text hierarchy.
4. **Smoke the core app path when relevant**
   - Privacy Gate → Capture/Input → Confirm/Draft → Home → Partner/Demo projection.
   - Do not require full auth for presentation-only changes, but state the lane.
5. **Leave a PR comment**
   - Use the template below.

## PR comment template

```markdown
### Vercel Preview QA

- URL:
- Commit:
- Lane: Real SLC / Presentation / Local preview
- Viewport/device:
- Paths checked:
- Result: Pass / Needs changes

Evidence:
- Screenshot/video/metric:

Checks:
- [ ] URL loads with expected status/redirect
- [ ] Mobile viewport reviewed
- [ ] Changed path verified
- [ ] No obvious regression in the core Fevio loop
- [ ] No secrets or private identifiers exposed

Skipped:
- Item:
- Reason:
- Owner/follow-up:
```

## Status-code smoke command

Use this when the preview URL is public:

```bash
curl -I -L --max-time 20 "$VERCEL_URL"
```

Expected:

- `200` for public presentation paths.
- Expected auth/privacy redirects for protected product paths.
- No `Root Directory "NudgeMe" does not exist` deployment failure in the Vercel log.

## Mobile visual gates

For Fevio UI PRs, reviewers must check:

- Desktop web: the app is constrained to the intended iPhone-like viewport when the design calls for it.
- Real mobile web: decorative device bezels are absent unless explicitly part of the demo.
- Text is readable in Korean without zooming.
- Interaction happens inside the phone/app viewport; the whole page should not become an accidental long scroll.
- Dynamic Island, safe area, and device-frame elements are anchored by device tokens, not arbitrary offsets.

## Release-critical escalation

If a PR touches Auth, Supabase writes, partner share links, reminders, privacy, or release demo visuals:

- Run the repository checks from `deployment-readiness.md`.
- Attach Playwright or manual Vercel evidence.
- Link the evidence to `#56` when it affects release readiness.
