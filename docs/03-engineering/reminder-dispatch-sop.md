# Reminder Dispatch SOP — MVP Web Push

## Current MVP route

Fevio exposes a protected scheduler endpoint:

- Path: `/api/reminders/send-due`
- Methods: `GET` and `POST`
- Auth: `Authorization: Bearer $CRON_SECRET`
- Output: `{ ok: true, result: { candidates, sent, skipped, failed } }`

MVP reminder channel is PWA Web Push. The route checks confirmed injection cards inside deterministic T-60 and T-15 reminder windows, claims a unique `reminder_dispatches(card_id, scheduled_at, channel)` row, sends a safe push payload, then marks the row `sent` or `failed`.

Do not use Resend/email for MVP reminder dispatch.

## Required production env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CRON_SECRET`

## Required Supabase Vault secrets for pg_cron

The committed migration `supabase/migrations/202605190003_web_push_pg_cron_scheduler.sql` does not store literal production secrets. Before applying/enabling the job remotely, add these Vault secrets in Supabase:

- `fevio_app_url`: production app origin, no trailing slash
- `fevio_cron_secret`: same value as Vercel `CRON_SECRET`

## Scheduler decision

**2026-05-19 MVP decision:** Supabase pg_cron invokes the protected route every minute. Vercel Hobby cron remains unsuitable for minute-level reminders, so do not add a high-frequency Vercel Cron on the current Hobby deployment.

The scheduler SQL uses pg_cron + pg_net:

```sql
select cron.schedule(
  'fevio-reminder-check',
  '* * * * *',
  $$ select net.http_post(...) $$
);
```

## Manual production smoke without sending push

```bash
curl -i https://project-oznp0.vercel.app/api/reminders/send-due
# Expected without auth or without configured CRON_SECRET: 401.
```

Do not trigger a real push send from a public ticket comment. Production send evidence must avoid posting browser subscription JSON, provider keys, recipient identifiers, or private account identifiers.
