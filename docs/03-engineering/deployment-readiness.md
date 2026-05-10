# Deployment readiness

This page exists so contributors can separate repo-owned build health from external Vercel project configuration.

## Repo-owned Green checks

A branch is repo-ready when these commands pass locally and in GitHub Actions:

```bash
npm ci
npm run test
npm run typecheck
npm run build
npm run test:e2e
```

GitHub Actions runs the same checks on pull requests and pushes to `main`. This gives reviewers a stable signal even while Vercel project settings are being repaired.

## Vercel project Red currently tracked outside the repo

GitHub deployments created by `vercel[bot]` are still failing under the existing Vercel project context:

```text
Deployment has failed — run this Vercel CLI command: npx vercel inspect <deployment-id> --logs
```

Observed constraints:

- The failing deployment URLs use `andy-lee0920s-projects.vercel.app`.
- The current local Vercel CLI context is `ckiwon7-6820s-projects`.
- `ckiwon7-6820s-projects` cannot inspect those failing deployments.
- A new CLI-created project with Root Directory `.` could not connect GitHub because the Vercel account needs a GitHub Login Connection first.

Therefore, do not close #38 while this Red remains. Use child issues for each Red → Green transition.

## Required Vercel Green evidence

The Vercel owner for the project connected to `Andy-Lee0920/ai-business-group10` should verify:

1. Project Settings → General → Root Directory is empty/default, not an old app folder.
2. The project is connected to the correct GitHub repository.
3. The connected Vercel account has a GitHub Login Connection.
4. A fresh deployment starts from repo root `package.json` and runs `npm run build`.
5. The deployment URL opens the Fevio shell.

Post evidence to #38 and the relevant child issue before closing them.
