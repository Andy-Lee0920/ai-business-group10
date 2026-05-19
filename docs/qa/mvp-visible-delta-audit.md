# Fevio MVP visible delta completion audit

Objective: 사진 한 장 → confirmed care card → Home/Partner/Reminder가 같은 canonical card를 본다.

This audit is a handoff artifact, not a completion claim. Do not mark the goal complete while the remaining live-device Reds below are open.

Latest audit refresh: `2026-05-19`, audit/tooling commit `1237ef9`, production runtime commit `9e70d761bbd2`, deploy `dpl_CMmERcZxKef1jsfe7KawDnAGaeai`. Commits after `9e70d761bbd2` are guard/runbook/audit tooling only; no product runtime redeploy is required for the remaining physical-device evidence collection.

## Fixed decisions

- ADR0013: new photo/OCR/AI flow uses the canonical `split_candidates → care_action_cards` spine. `schedule_items` and `schedule_candidates` are legacy fallback only.
- ADR0014: medication reference image is deterministic only. No LLM/free-text guessing; hide the image when no mapped asset exists.
- Information density: Home/Partner first fold is low-noise high-signal, primary action first, no dense stats block.
- Reminder: T-60/T-15 offsets, `WINDOW_RADIUS_MINUTES = 5`, dedup key `(card_id, scheduled_at, channel)`.
- iOS launch path: Home Screen PWA, manifest id/scope/start_url/standalone, and gesture-bound notification permission.

## Prompt-to-artifact checklist

| Slice | Required behavior | Evidence artifact | Current status |
| --- | --- | --- | --- |
| #379 | Reminder uses T-60/T-15 with ±5min sweep and `(card_id, scheduled_at, channel)` dedup | `src/domain/reminder-dispatch.ts`, reminder migrations, `tests/unit/reminder-dispatch.test.ts`, `tests/integration/reminder-send-due-route.test.ts` | Green/closed |
| #387 | `/home` reads confirmed `care_action_cards primary` and keeps `schedule_items` fallback | `app/(authed)/home/page.tsx`, projection tests, production smoke comment | Green/closed |
| #386 | photo/text candidates confirm into `split_candidates → care_action_cards`, not new `schedule_items` | `/api/onboard/candidates/confirm`, `/onboard/prescription-capture`, route/e2e tests | Green/closed |
| #384 | Partner first fold is `오늘 도와줄 일`, action-first, raw memo/token hidden, 3s visible-only polling | `PartnerRoleSurface`, `partner_assist_at`, partner route/e2e evidence | Green/closed |
| #385 | Home hero is low-noise: no countdown 3-row info block or overdue 3-chip stats in first fold; clinic completion copy is not “복용했나요?” | Today screen tests and production mobile smoke | Green/closed |
| #388 | Medication reference image chosen by deterministic mapping only; image hides when unmapped; copy is “확인을 돕는 참고 이미지” | ADR0014, reference asset mapping, home visual smoke | Green/closed |
| #376 | Same-image current-vs-Gemini OpenRouter comparison before any model switch | `scripts/compare-openrouter-vision-models.mjs`, `scripts/vision-model-quality.mjs`, `tests/fixtures/vision-model/*`, production-safe temporary Supabase comparison evidence | Green/closed: Gemini 20/20 vs Haiku 17/20; production schedule-extract smoke 20/20 after env switch |
| #377 | PWA manifest/SW/subscription infrastructure exists | `public/manifest.json`, `public/sw.js`, `src/lib/pwa-push-client.ts`, `src/lib/pwa-install-guidance.ts`, `scripts/verify-production-pwa-prereqs.mjs`, `tests/unit/push-infra-contract.test.ts` | Parent open: implementation Green, production prerequisite smoke Green, live child Reds remain |
| #380 | pg_cron/server scheduler path exists and is authenticated | scheduler migration, `CRON_SECRET` Vercel env name evidence, send-due tests | Parent open: server Green, live child Reds remain |
| #382 | Android live device receives/taps/dedups PWA notification | `docs/qa/pwa-live-push-smoke.md`, `scripts/prepare-pwa-live-push-card.mjs`, `scripts/collect-pwa-live-push-evidence.mjs`, `scripts/archive-pwa-live-push-card.mjs` | Red/open: real Android device evidence required |
| #383 | iPhone Home Screen PWA receives/taps/dedups PWA notification | `docs/qa/pwa-live-push-smoke.md`, `scripts/prepare-pwa-live-push-card.mjs`, `scripts/collect-pwa-live-push-evidence.mjs`, `scripts/archive-pwa-live-push-card.mjs` | Red/open: real iPhone Home Screen PWA evidence required |

## Verification already run

- Targeted tests for canonical photo confirmation, partner assist, home projection, reminder dispatch, PWA infra, safety filtering, vision-model fixtures, live-smoke runbook, synthetic smoke-card preparation helper, masked live-push evidence helper, synthetic-card archive helper, npm live-smoke helper commands, production PWA prerequisite smoke, and GitHub-ready live-device evidence comment formatting.
- `npm run typecheck` passed after the implementation slices.
- `npm test` passed: 171 files / 633 tests after live-push prep/evidence/archive helper additions, npm smoke helper entrypoints, production PWA prerequisite smoke, evidence comment formatting, closure evidence guarding, service-worker notificationclick behavior coverage, live evidence bundle scaffolding, physical-device readiness guard, and final MVP completion gate.
- `npm run build` passed after the app/runtime implementation slices; later helper-only commits were verified with typecheck and full unit suite.
- `supabase migration list --linked` showed remote migrations through `202605190006` applied, including push subscriptions, reminder dispatch, partner assist, medication reference assets, and canonical capture completion support.
- Production URL-action-result evidence was posted for `/onboard/prescription-capture → /home → /partner/[token]` on the canonical `care_action_cards` spine.
- Latest production refresh on runtime commit `9e70d761bbd2` passed `npm run typecheck`, `npm test` (169 files / 628 tests), `npm run build`, `npm run test:e2e` (6/6), deploy smoke, and production PWA prerequisite smoke. Later commits `4e67397` and `1237ef9` added local guard/runbook tooling and were verified with `npm run typecheck`, `npm test` (171 files / 633 tests), `npm run verify:mvp:readiness`, `npm run verify:push:issues`, and expected failing completion/device gates.


## Production PWA prerequisite smoke

Green evidence:

- Command: `npm run smoke:pwa:production`.
- Script: `scripts/verify-production-pwa-prereqs.mjs`.
- Production URL: `https://project-oznp0.vercel.app`.
- Latest deploy: `dpl_CMmERcZxKef1jsfe7KawDnAGaeai` for commit `9e70d761bbd2`.
- Verified `/manifest.json` has `id`, `scope`, `start_url`, `display: standalone`, and icons.
- Verified `/sw.js` handles push display and `notificationclick` tap-through to `/home`.
- Verified `/api/push/subscribe` and `/api/reminders/send-due` are reachable but auth-safe without test credentials (`405/401` in the latest production smoke).
- This does not replace live-device evidence for #382/#383.


## Live-device evidence comment formatting

Green evidence:

- Command option: `npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler --format github-comment --platform android`.
- Command option: `npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler --format github-comment --platform ios`.
- Script support: `scripts/collect-pwa-live-push-evidence.mjs` formats masked DB rows into #382/#383 GitHub comment templates.
- The generated `github-comment` output still requires attached physical-device screenshots/videos before closure.





## Physical device readiness preflight

Green evidence:

- Command: `npm run verify:push:devices`.
- Script: `scripts/verify-live-push-device-readiness.mjs`.
- Purpose: detects whether the current runner can see a physical Android device and a physical iOS device before attempting #382/#383 live smoke.
- Current runner status: blocked until physical devices are connected; this command is not a closure gate and does not replace L3/L4/L6/L7 evidence.

## Live-device evidence bundle scaffold

Green evidence:

- Command: `npm run smoke:push:bundle -- --platform android --out-dir tmp/live-push-evidence`.
- Command: `npm run smoke:push:bundle -- --platform ios --out-dir tmp/live-push-evidence`.
- Script: `scripts/create-live-push-evidence-bundle.mjs`.
- Creates a platform-specific README and placeholder `evidence.json` with required media filenames and commands for `smoke:pwa:production`, `smoke:push:prepare`, `smoke:push:evidence`, `verify:push:closure`, and `smoke:push:archive`.
- This scaffold does not replace real-device media.

## Service-worker tap-through behavior

Green evidence:

- Test: `tests/unit/service-worker-notificationclick-behavior.test.ts`.
- Verifies notification clicks without an explicit URL open `https://project-oznp0.vercel.app/home`.
- Verifies push payload URLs must be path-only; external URLs fall back to `/home`.
- This supports L4 readiness but does not replace physical notification tap-through evidence for #382/#383.

## Live-device closure guard

Green evidence:

- Command: `npm run verify:push:closure -- --platform android --evidence-json evidence.json --l3-media l3-tray.png --l4-media l4-home.png --l6-media l6-lockscreen.mov`.
- Command: `npm run verify:push:closure -- --platform ios --evidence-json evidence.json --ios-install-media ios-homescreen.png --l3-media l3-notification.png --l4-media l4-home.png --l6-media l6-lockscreen.mov`.
- Script: `scripts/verify-live-push-closure-evidence.mjs`.
- The guard fails DB-only packages and requires L3/L4/L6 physical media files; iOS additionally requires Home Screen install media. It also fails missing scheduler rerun evidence and duplicate sent dispatch rows for the same `(card_id, scheduled_at, channel)`.
- Passing the guard does not replace reviewer judgment or the required GitHub evidence comments.

## GitHub issue state guard

Green evidence:

- Command: `npm run verify:push:issues`.
- Script: `scripts/verify-live-push-issue-state.mjs`.
- Verifies #377, #380, #382, and #383 remain open while physical live-device Reds remain open.
- Current check output: `#377 OPEN`, `#380 OPEN`, `#382 OPEN`, `#383 OPEN`, `live push issue state guard passed`.

## MVP local readiness guard

Green evidence:

- Command: `npm run verify:mvp:readiness`.
- Script: `scripts/verify-mvp-visible-delta-readiness.mjs`.
- Verifies canonical spine artifacts, reminder/PWA/live-smoke helpers, audit/runbook coverage, and GitHub issue state.
- This is not a completion gate; it intentionally preserves #382/#383 physical-device Reds.

## Completed model gate

### #376 model gate

Green evidence:

- Synthetic, production-safe fixtures exist under `tests/fixtures/vision-model/`.
- Same-image current-vs-Gemini comparison ran through a temporary Supabase Edge Function using the existing `OPENROUTER_API_KEY` secret without exposing the key. The temporary function was deleted after the run.
- Result: `google/gemini-3-flash-preview` scored `20/20`; `anthropic/claude-haiku-4.5` scored `17/20`.
- Supabase Edge Function env `OPENROUTER_VISION_MODEL=google/gemini-3-flash-preview` is set.
- Vercel Production env `OPENROUTER_VISION_MODEL=google/gemini-3-flash-preview` is set.
- `schedule-extract` was redeployed.
- Production fixture smoke now scores `20/20` and keeps candidate types aligned with source: `injection`, `medication`, `clinic`.

## Remaining Reds

### Current runner blocker

Codex runner cannot produce the final physical-device evidence in its current state:

- `npm run verify:push:devices`: Android physical device `MISSING`, iOS physical device `MISSING`.
- `adb devices`: `adb` is not installed.
- `xcrun xctrace list devices`: no physical iOS device surfaced.
- USB scan: no iPhone/iPad/Android device detected.

GitHub blocker comments:

- Android #382: https://github.com/Andy-Lee0920/ai-business-group10/issues/382#issuecomment-4486241271
- iOS #383: https://github.com/Andy-Lee0920/ai-business-group10/issues/383#issuecomment-4486241479

### #382 Android live push

Requires real Android device evidence:

- Prerequisite smoke: `npm run smoke:pwa:production` before physical device testing
- L1: push subscription row
- L2: reminder dispatch row
- L3: OS notification tray receipt
- L4: notification tap opens `/home`
- L6: lock-screen/background receipt
- L7: live dedup for `(card_id, scheduled_at, channel)`
- Prep helper: `npm run smoke:push:prepare -- --user-id <user-id> --offset-minutes 15` after privacy gate acceptance
- Evidence helper: `npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler` after physical receipt/tap evidence
- Archive helper: `npm run smoke:push:archive -- --card-id <card-id>` after evidence capture, only for synthetic smoke cards

### #383 iOS live push

Requires real iPhone Home Screen PWA evidence:

- Prerequisite smoke: `npm run smoke:pwa:production` before physical device testing
- iG1: Add to Home Screen guidance
- iG2: gesture-bound permission request
- iG3: manifest id/scope/start_url/standalone/icons
- L1: push subscription row
- L2: reminder dispatch row
- L3: iPhone notification receipt
- L4: notification tap opens Home Screen PWA `/home`
- L6: lock-screen/background receipt
- L7: live dedup for `(card_id, scheduled_at, channel)`
- Prep helper: `npm run smoke:push:prepare -- --user-id <user-id> --offset-minutes 15` after privacy gate acceptance
- Evidence helper: `npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler` after physical receipt/tap evidence
- Archive helper: `npm run smoke:push:archive -- --card-id <card-id>` after evidence capture, only for synthetic smoke cards


## Final MVP completion gate

The active goal must not be marked complete from readiness checks alone. After Android and iOS evidence bundles are collected, run:

```bash
npm run verify:mvp:complete -- \
  --android-evidence-json android-evidence.json \
  --android-l3-media android-l3.png \
  --android-l4-media android-l4.png \
  --android-l6-media android-l6.mov \
  --ios-evidence-json ios-evidence.json \
  --ios-install-media ios-install.png \
  --ios-l3-media ios-l3.png \
  --ios-l4-media ios-l4.png \
  --ios-l6-media ios-l6.mov
```

This wraps readiness plus both physical-device closure evidence checks.

## Stop condition

Do not mark the goal complete until #382 and #383 have concrete live-device evidence comments and their parent issues #377/#380 are either closed with child Green evidence or explicitly scoped out by the owner.
