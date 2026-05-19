# Fevio MVP visible delta completion audit

Objective: 사진 한 장 → confirmed care card → Home/Partner/Reminder가 같은 canonical card를 본다.

This audit is a handoff artifact, not a completion claim. Do not mark the goal complete while the remaining live-device Reds below are open.

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
| #377 | PWA manifest/SW/subscription infrastructure exists | `public/manifest.json`, `public/sw.js`, `src/lib/pwa-push-client.ts`, `src/lib/pwa-install-guidance.ts`, `tests/unit/push-infra-contract.test.ts` | Parent open: implementation Green, live child Reds remain |
| #380 | pg_cron/server scheduler path exists and is authenticated | scheduler migration, `CRON_SECRET` Vercel env name evidence, send-due tests | Parent open: server Green, live child Reds remain |
| #382 | Android live device receives/taps/dedups PWA notification | `docs/qa/pwa-live-push-smoke.md`, `scripts/prepare-pwa-live-push-card.mjs`, `scripts/collect-pwa-live-push-evidence.mjs`, `scripts/archive-pwa-live-push-card.mjs` | Red/open: real Android device evidence required |
| #383 | iPhone Home Screen PWA receives/taps/dedups PWA notification | `docs/qa/pwa-live-push-smoke.md`, `scripts/prepare-pwa-live-push-card.mjs`, `scripts/collect-pwa-live-push-evidence.mjs`, `scripts/archive-pwa-live-push-card.mjs` | Red/open: real iPhone Home Screen PWA evidence required |

## Verification already run

- Targeted tests for canonical photo confirmation, partner assist, home projection, reminder dispatch, PWA infra, safety filtering, vision-model fixtures, live-smoke runbook, synthetic smoke-card preparation helper, masked live-push evidence helper, and synthetic-card archive helper.
- `npm run typecheck` passed after the implementation slices.
- `npm test` passed: 158 files / 601 tests after the Gemini model switch and completeness selector repair.
- `npm run build` passed after the latest implementation and QA artifacts.
- `supabase migration list --linked` showed remote migrations through `202605190006` applied, including push subscriptions, reminder dispatch, partner assist, medication reference assets, and canonical capture completion support.
- Production URL-action-result evidence was posted for `/onboard/prescription-capture → /home → /partner/[token]` on the canonical `care_action_cards` spine.

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

### #382 Android live push

Requires real Android device evidence:

- L1: push subscription row
- L2: reminder dispatch row
- L3: OS notification tray receipt
- L4: notification tap opens `/home`
- L6: lock-screen/background receipt
- L7: live dedup for `(card_id, scheduled_at, channel)`
- Prep helper: `node scripts/prepare-pwa-live-push-card.mjs --user-id <user-id> --offset-minutes 15` after privacy gate acceptance
- Evidence helper: `node scripts/collect-pwa-live-push-evidence.mjs --user-id <user-id> --card-id <card-id> --rerun-scheduler` after physical receipt/tap evidence
- Archive helper: `node scripts/archive-pwa-live-push-card.mjs --card-id <card-id>` after evidence capture, only for synthetic smoke cards

### #383 iOS live push

Requires real iPhone Home Screen PWA evidence:

- iG1: Add to Home Screen guidance
- iG2: gesture-bound permission request
- iG3: manifest id/scope/start_url/standalone/icons
- L1: push subscription row
- L2: reminder dispatch row
- L3: iPhone notification receipt
- L4: notification tap opens Home Screen PWA `/home`
- L6: lock-screen/background receipt
- L7: live dedup for `(card_id, scheduled_at, channel)`
- Prep helper: `node scripts/prepare-pwa-live-push-card.mjs --user-id <user-id> --offset-minutes 15` after privacy gate acceptance
- Evidence helper: `node scripts/collect-pwa-live-push-evidence.mjs --user-id <user-id> --card-id <card-id> --rerun-scheduler` after physical receipt/tap evidence
- Archive helper: `node scripts/archive-pwa-live-push-card.mjs --card-id <card-id>` after evidence capture, only for synthetic smoke cards

## Stop condition

Do not mark the goal complete until #382 and #383 have concrete live-device evidence comments and their parent issues #377/#380 are either closed with child Green evidence or explicitly scoped out by the owner.
