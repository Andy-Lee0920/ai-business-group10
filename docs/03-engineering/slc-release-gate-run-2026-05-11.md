# SLC release-gate run — 2026-05-11

Status: executed evidence for `#56`.

## Scope decision

Fevio Day3 progress is measured by closed core issues. Non-core email sending and external scheduler proof do not block the SLC release gate for this run. The SLC core is the in-app care loop: privacy/onboarding → input/interview → confirmed care state → partner projection/demo proof.

## Build and CI evidence

| Item | Evidence |
|---|---|
| Tested commit | `62e84a1` |
| GitHub Actions | run `25673435963` passed unit/typecheck/build/e2e |
| Real SLC URL | `https://project-oznp0.vercel.app` |
| Presentation URL | `https://ai-business-group10.vercel.app` |
| Production deploy | SLC deploy `dpl_7D4y4KLCdDFpNKG1nBrFXGCrL7B5` |
| Secret hygiene | No secret values or private identifiers are recorded in this artifact. |

## Production route smoke

Automated browser smoke was run against `https://project-oznp0.vercel.app` on 2026-05-11 KST. Local raw evidence is stored under `.omx/evidence/release-gate-2026-05-11/` and is intentionally not committed.

| Route | Result | Release-gate meaning |
|---|---:|---|
| `/` | `200` | SLC host opens. |
| `/privacy` | `200` | Privacy gate is reachable. |
| `/onboarding` without privacy cookie | `307 → /privacy` | Sensitive onboarding is privacy-gated. |
| `/onboarding` with demo acceptance cookie | `200`, first question visible | Interview onboarding is reachable after gate acceptance. |
| `/demo` | `200` | Dual-view demo surface opens. |
| `/partner/demo` | `200` | Partner projection demo opens. |
| `/schedule` without privacy cookie | `307 → /privacy` | Input routes remain gated. |
| `/medication` without privacy cookie | `307 → /privacy` | Input routes remain gated. |
| `/auth/sign-in` | `307` on SLC host | Sign-in route is protected/redirecting; full human Google OAuth was not performed by the agent. |
| `/api/reminders/send-due` without auth | `401` | Reminder dispatch route is protected. |

## Mobile and demo UX smoke

| Surface | Evidence | Result |
|---|---|---|
| Onboarding | `Question 01` and `어디쯤에 있으세요?` visible with `393px` viewport and `scrollWidth=393` | Pass: no horizontal overflow and the interview step is visible after privacy acceptance. |
| Desktop dual-view demo | Browser text includes `LIVE SYNC`; two iPhone frames and two dynamic-island elements detected | Pass: demo reads as two phone surfaces with live-sync language. |
| Partner demo | Role-action copy present, avoidance copy present, raw leak check false | Pass: partner surface exposes role/action guidance instead of raw memo leakage. |

## Supabase and reminder evidence

| Item | Evidence | Result |
|---|---|---|
| Remote migration floor | Supabase remote DB has migrations through `202605110003_reminder_dispatches.sql` | Pass. |
| Reminder RPC smoke | Safe future-window smoke returned `rpcOk: true`, `candidateCount: 0`, `tableOk: true` | Pass: schema/RPC path exists without sending mail. |
| Reminder dispatch endpoint | Unauthorized production request returns `401` | Pass: protected route exists. |
| Email/scheduler proof | Explicitly de-scoped as non-core and tracked by closed `#124` (`not planned`) | Not a blocker. |

## Known limits / not claimed

- A full human Google OAuth login was not completed by this agent run; the route/redirect behavior was checked only.
- External email delivery and scheduler cadence are not part of the core SLC closure criteria after the user explicitly authorized bypassing non-core mail work.
- Screenshots are not committed to avoid accidental private data leakage; this run records route and DOM-level smoke evidence instead.

## Closure interpretation

`#56` can close when this artifact is committed with the checklist update because the release-gate proof now has: final commit, production URLs, CI status, route smoke, mobile onboarding proof, dual-view proof, partner-projection proof, Supabase/RPC evidence, and explicit scoped-out gates.
