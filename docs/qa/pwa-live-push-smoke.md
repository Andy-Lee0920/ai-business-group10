# Fevio PWA live push smoke runbook

This runbook is the reproducible evidence path for #382 and #383. It does not replace live-device evidence: Android and iOS issues stay Red until the device receipt, tap-through, and dedup proof are posted on GitHub.

## Scope

- Production URL: `https://project-oznp0.vercel.app/home`
- Reminder channels: `web_push_t60`, `web_push_t15`
- Reminder sweep: T-60/T-15 offsets with ±5 minute tolerance
- Dedup key to prove: `(card_id, scheduled_at, channel)`
- Payload boundary: notification may contain a short card title/time/deeplink only. Do not expose raw clinic memo, raw partner token, VAPID keys, auth tokens, or private user details in screenshots/comments.

## Shared setup

1. Use a test account that has accepted privacy/onboarding boundaries.
2. Create or confirm one `care_action_cards` row for an injection/partner-visible card scheduled inside the next T-60 or T-15 reminder window.
3. Keep the card title synthetic or non-identifying.
4. Mask endpoint values before posting evidence (`https://...abcd` is enough).
5. Collect DB evidence from:
   - `push_subscriptions`: user, endpoint masked, created/updated timestamp, no clinic payload columns.
   - `reminder_dispatches`: `card_id`, `scheduled_at`, `channel`, `status`, `provider_message_id` masked, `sent_at`.
6. Re-run the scheduler once after a successful send and confirm duplicate dispatch is skipped rather than creating a second sent row for the same `(card_id, scheduled_at, channel)`.
7. Use the evidence helper after the device receives/taps the notification; endpoint/provider ids are masked and subscription keys are not printed:

   ```bash
   node scripts/collect-pwa-live-push-evidence.mjs --user-id <user-id> --card-id <card-id> --rerun-scheduler
   ```

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
