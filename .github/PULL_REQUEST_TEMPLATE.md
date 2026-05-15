## Summary

-

## Issue / scope

- Closes or updates:
- Out of scope:

## Tests

- [ ] `npm run test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run test:e2e` when navigation, auth, partner view, or visual shell changed


## Mainline / deploy drift guard

- [ ] Any issue comment marked Green evidence references a commit that is merged into `main`
- [ ] Production deploys to `project-oznp0` use `npm run deploy:production` from `origin/main`
- [ ] If this PR restores branch-only work, the restored issue evidence is refreshed after production redeploy

## Vercel Preview QA

Follow `docs/03-engineering/vercel-preview-sop.md`.
For SLC/P0 release changes, also update `docs/03-engineering/slc-release-gate-checklist.md` and attach/mention the latest release-gate run artifact.

- URL:
- Commit:
- Lane: Real SLC / Presentation / Local preview
- Viewport/device:
- Paths checked:
- Evidence:

Minimum checks:

- [ ] URL loads with expected status/redirect
- [ ] Mobile viewport reviewed
- [ ] Changed path verified
- [ ] No secrets or private identifiers exposed

## Screenshots / metrics

-

## Known gaps

-
