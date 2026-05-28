# Release Baseline — 2026-05-12

Issue: [#195](https://github.com/Andy-Lee0920/ai-business-group10/issues/195)

Purpose: freeze the current `main`/local/Vercel parity before continuing the partner-account, sharing persistence, and demo QA work. This document distinguishes code that is currently committed and externally visible from items that remain follow-up work.

## Baseline identity

| Field | Value |
| --- | --- |
| Repository | `Andy-Lee0920/ai-business-group10` |
| Branch | `main` |
| Baseline commit | `3defe6f Make onboarding create the first care state` |
| Checked at | 2026-05-12 18:59 KST |
| Presentation host | <https://ai-business-group10.vercel.app> |
| Real SLC host | <https://project-oznp0.vercel.app> |

## Local working tree parity

Command:

```bash
git status --short --branch --untracked-files=all
```

Result at baseline:

```text
## main...origin/main
?? .omx/...
```

Interpretation:

- No tracked source file is locally modified.
- The only untracked paths are `.omx/` runtime evidence, screenshots, and planning artifacts.
- `.omx/` is not part of the product source baseline and should not be committed for this release gate.

## Recent issue parity

Recently closed onboarding / home / partner slices are present in `main` at the baseline commit.

| Issue | Status in baseline |
| --- | --- |
| #184 Onboarding 4-step skeleton | Present in `app/onboarding/onboarding-client.tsx` |
| #185 inferredStage function | Present in `src/domain/onboarding-care-state.ts` |
| #186 onboarding copy tone | Present in onboarding UI copy |
| #187 text-first + photo capture sub-flow | Present in onboarding step 2 |
| #188 roleContext selection | Present in onboarding sharing role step |
| #189 generated home preview | Present in onboarding review step |
| #190 defaultSharingLevelByStage + API payload | Present in `src/domain/onboarding-care-state.ts` and onboarding API response/cookies |
| #191 confidence-based stage correction | Present in onboarding review step |
| #192 generated home transition | Present in onboarding generation screen |
| #193 PartnerPresencePulse + invite prep card | Present in adaptive home partner invite/presence surface |
| #194 E2E 4-step flow + onboarding principle docs | Present in tests and documentation |

## Vercel smoke results

### Presentation host

Commands:

```bash
curl -I -L 'https://ai-business-group10.vercel.app/demo?mode=stage&stage=2'
curl -I -L 'https://ai-business-group10.vercel.app/onboarding'
curl -I -L 'https://ai-business-group10.vercel.app/home'
```

Observed results:

| Route | Result | Baseline expectation |
| --- | --- | --- |
| `/demo?mode=stage&stage=2` | `200`, matched path `/demo` | Presentation demo is externally visible |
| `/onboarding` | `307` to `/privacy`, then `200` privacy page | Unaccepted privacy gate blocks onboarding |
| `/home` | `200`, matched path `/home` | Presentation host can render home route |

Demo marker check:

| Route | Required markers observed |
| --- | --- |
| `/demo?mode=stage&stage=2` | `21:00 주사 기록`, `약 이름과 준비물 확인` |
| `/demo?mode=stage&stage=5` | `배아 업데이트`, `공유된 업데이트` |
| `/demo?mode=stage&stage=7` | `hCG 결과`, `다음 검사` |

### Real SLC host

Command:

```bash
curl -I -L 'https://project-oznp0.vercel.app/home'
```

Observed result:

- Initial `/home` request redirects unauthenticated users to `/auth/sign-in`.
- `/auth/sign-in` redirects to Supabase Google OAuth.
- This is the expected real-lane auth boundary for an unauthenticated smoke check.

## Implemented vs follow-up

### Implemented and baseline-visible

- 7-stage state-driven demo route with role-aware patient/partner utility cards.
- Demo URL deep links for IVF stages.
- Onboarding 4-step skeleton with deterministic stage inference and correction.
- Role context and default sharing level payload/cookie wiring.
- Generated home transition and preview.
- Partner invite preparation / presence surface on home.
- Privacy/auth boundary for real-lane unauthenticated users.

### Implemented in architecture/code, but not yet complete as product flow

- Partner projection and permission model exist, but real partner account join into a shared care cycle remains a follow-up.
- Sharing scope exists in demo/domain/API payloads, but persistent patient-owned sharing management across partner projection remains a follow-up.
- Onboarding creates the first care state, but the next release slice must harden the full onboarding → care cycle → home state contract.

### Explicit follow-up tickets

- [#196](https://github.com/Andy-Lee0920/ai-business-group10/issues/196) — `/demo` product-grade visual QA.
- [#197](https://github.com/Andy-Lee0920/ai-business-group10/issues/197) — onboarding complete flow creates initial care cycle state.
- [#198](https://github.com/Andy-Lee0920/ai-business-group10/issues/198) — real partner account join into shared care cycle.
- [#199](https://github.com/Andy-Lee0920/ai-business-group10/issues/199) — persistent patient-owned sharing scope.

## Stop condition

This baseline is sufficient for downstream work when:

- source working tree has no unintended tracked WIP;
- Vercel presentation demo responds with stage-specific markers;
- real lane preserves the auth boundary;
- follow-up gaps are represented by issues rather than hidden in local state.
