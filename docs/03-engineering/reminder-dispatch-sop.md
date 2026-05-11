# Reminder Dispatch SOP — #52

## Current SLC route

Fevio exposes a protected scheduler endpoint:

- Path: `/api/reminders/send-due`
- Methods: `GET` and `POST`
- Auth: `Authorization: Bearer $REMINDER_DISPATCH_SECRET` or `Authorization: Bearer $CRON_SECRET`
- Output: `{ ok: true, result: { candidates, sent, skipped, failed } }`

The route checks confirmed injection cards whose `scheduled_at` is inside the 30-minute reminder window, claims a unique `reminder_dispatches(card_id, scheduled_at, channel)` row, sends deterministic Korean email copy through Resend, then marks the row `sent` or `failed`.

## Required production env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `REMINDER_FROM_EMAIL`
- `REMINDER_DISPATCH_SECRET` or `CRON_SECRET`

## Scheduler decision

Do **not** add a high-frequency Vercel Cron on the current Hobby deployment. Vercel rejected `* * * * *` during production deploy because Hobby accounts are limited to daily cron jobs.

For #52 full Green, use one of these environment decisions:

1. Supabase scheduled function / pg_cron invokes the protected route every minute with the secret header.
2. Upgrade the Vercel project plan and add a one-minute Cron only after the plan supports it.
3. Explicitly accept SLC with in-app emphasis plus the protected dispatch route, and keep external scheduler/provider send evidence as a child Red.

## Manual production smoke without sending email

```bash
curl -i https://project-oznp0.vercel.app/api/reminders/send-due
# Expected without auth: 401 when secret is configured, 503 if scheduler secret is missing.
```

Do not trigger a real email send from a public ticket comment. Production send evidence must avoid posting recipient addresses, provider keys, or private account identifiers.
