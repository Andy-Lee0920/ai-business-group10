# Fevio PWA live push smoke runbook

This runbook is the reproducible evidence path for #382 and #383. It does not replace live-device evidence: Android and iOS issues stay Red until the device receipt, tap-through, and dedup proof are posted on GitHub.

## Scope

- Production URL: `https://project-oznp0.vercel.app/home`
- Reminder channels: `web_push_t60`, `web_push_t15`
- Reminder sweep: T-60/T-15 offsets with ±5 minute tolerance
- Dedup key to prove: `(card_id, scheduled_at, channel)`
- Payload boundary: notification may contain a short card title/time/deeplink only. Do not expose raw clinic memo, raw partner token, VAPID keys, auth tokens, or private user details in screenshots/comments.


## Evidence bundle scaffold

To create a local folder with the exact filenames and commands needed for closure review:

```bash
npm run smoke:push:bundle -- --platform android --out-dir tmp/live-push-evidence
npm run smoke:push:bundle -- --platform ios --out-dir tmp/live-push-evidence
```

The generated README still requires real-device media before #382/#383 can close.

## Production prerequisite smoke

Before using physical Android/iOS devices, verify the deployed PWA shell and auth-safe push routes. This does not replace live-device evidence; it only proves the production URL has the required manifest, service worker, and non-dispatching unauthenticated push endpoints.

```bash
npm run smoke:pwa:production
```

## Shared setup

1. Use a test account that has accepted privacy/onboarding boundaries.
2. Create or confirm one `care_action_cards` row for an injection/partner-visible card scheduled inside the next T-60 or T-15 reminder window. To prepare a synthetic confirmed injection card without hand-written SQL:

   ```bash
   npm run smoke:push:prepare -- --user-id <user-id> --offset-minutes 15
   ```

3. Keep the card title synthetic or non-identifying.
4. Mask endpoint values before posting evidence (`https://...abcd` is enough).
5. Collect DB evidence from:
   - `push_subscriptions`: user, endpoint masked, created/updated timestamp, no clinic payload columns.
   - `reminder_dispatches`: `card_id`, `scheduled_at`, `channel`, `status`, `provider_message_id` masked, `sent_at`.
6. Re-run the scheduler once after a successful send and confirm duplicate dispatch is skipped rather than creating a second sent row for the same `(card_id, scheduled_at, channel)`.
7. Use the evidence helper after the device receives/taps the notification; endpoint/provider ids are masked and subscription keys are not printed:

   ```bash
   npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler
   ```

   To generate a GitHub-ready evidence comment after collecting real-device screenshots/videos:

   ```bash
   npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler --format github-comment --platform android
   npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler --format github-comment --platform ios
   ```

   Attach real-device screenshots or videos before closing #382/#383. The generated comment does not replace live-device evidence.

8. Optional cleanup after evidence is captured: archive only the synthetic smoke card, never delete care history:

   ```bash
   npm run smoke:push:archive -- --card-id <card-id>
   ```


## Closure guard

Before closing #382 or #383, save the JSON output from `npm run smoke:push:evidence` and verify the physical evidence bundle locally. This guard requires DB evidence plus L3/L4/L6 media files, and iOS additionally requires Home Screen install media.

```bash
npm run verify:push:closure -- --platform android --evidence-json evidence.json --l3-media l3-tray.png --l4-media l4-home.png --l6-media l6-lockscreen.mov
npm run verify:push:closure -- --platform ios --evidence-json evidence.json --ios-install-media ios-homescreen.png --l3-media l3-notification.png --l4-media l4-home.png --l6-media l6-lockscreen.mov
```

Passing this guard does not replace reviewer judgment; it only prevents DB-only closure.

Before and after posting closure evidence, verify the GitHub issue state guard so parent issues and live-device children cannot be accidentally closed while #382/#383 are still Red:

```bash
npm run verify:push:issues
```

This command checks #377, #380, #382, and #383. It fails if a live-device child is closed without physical evidence or if a parent closes while live-device Reds remain open.

## Android Chrome (#382)

Green gates:

- L1: Android Chrome authenticated user taps the home bell and a `push_subscriptions` row is created.
- L2: pg_cron or manual `/api/reminders/send-due` run creates a `reminder_dispatches` row.
- L3: notification appears in the Android notification tray.
- L4: tapping the notification opens `/home`.
- L6: notification arrives while the device is locked or the browser is backgrounded.
- L7: one channel receives exactly one live notification and the dedup row proves no duplicate sent dispatch.

Evidence comment template:

```text
Android live smoke Green/Red update
Device/OS/Chrome:
URL verified: https://project-oznp0.vercel.app/home
Role/action/result: authenticated patient enables notification from the home bell, receives reminder, taps it, and lands on /home.
L1 push_subscriptions: endpoint masked, row timestamp
L2 reminder_dispatches: card_id, scheduled_at, channel, status=sent
L3 foreground/tray evidence: screenshot/video attached
L4 tap-through: screenshot/video attached
L6 lock-screen/background evidence: screenshot/video attached
L7 dedup: second scheduler run did not create duplicate sent row for (card_id, scheduled_at, channel)
Red remaining, if any:
```

Do not close #382 unless every L1/L2/L3/L4/L6/L7 line is supported by real-device evidence.

## iPhone Home Screen PWA (#383)

Extra iOS setup:

1. Use iOS/iPadOS 16.4+.
2. Open Safari on `https://project-oznp0.vercel.app`.
3. Add to Home Screen.
4. Launch Fevio from the Home Screen icon, not from a normal Safari tab.
5. Tap the home bell so notification permission is gesture-bound. Permission must not be auto-requested.

Green gates:

- iG1: Add to Home Screen guidance is visible before permission is requested when needed.
- iG2: permission request is gesture-bound to the bell tap.
- iG3: manifest includes `id`, `scope`, `start_url`, `display: standalone`, and icons.
- L1: Home Screen PWA creates a `push_subscriptions` row.
- L2: pg_cron or manual `/api/reminders/send-due` creates a `reminder_dispatches` row.
- L3: iPhone notification appears.
- L4: tapping the notification opens the Home Screen PWA on `/home`.
- L6: notification arrives while the phone is locked or the PWA is backgrounded.
- L7: one channel receives exactly one live notification and dedup prevents a duplicate sent dispatch.

Evidence comment template:

```text
iOS Home Screen PWA live smoke Green/Red update
Device/iOS/Safari:
URL verified: https://project-oznp0.vercel.app/home
Home Screen install evidence:
Role/action/result: authenticated patient launches Home Screen PWA, taps bell, receives reminder, taps it, and lands on /home.
iG1/iG2/iG3 evidence:
L1 push_subscriptions: endpoint masked, row timestamp
L2 reminder_dispatches: card_id, scheduled_at, channel, status=sent
L3 foreground evidence: screenshot/video attached
L4 tap-through: screenshot/video attached
L6 lock-screen/background evidence: screenshot/video attached
L7 dedup: second scheduler run did not create duplicate sent row for (card_id, scheduled_at, channel)
Red remaining, if any:
```

Do not close #383 unless every iG1/iG2/iG3 and L1/L2/L3/L4/L6/L7 line is supported by real-device evidence.
