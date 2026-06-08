import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('reminder infrastructure contract', () => {
  it('documents the protected scheduler route without adding a Vercel Hobby-blocking high-frequency cron', () => {
    const sop = readFileSync('docs/03-engineering/reminder-dispatch-sop.md', 'utf8');
    expect(sop).toContain('/api/reminders/send-due');
    expect(sop).toContain('Authorization: Bearer');
    expect(sop).toContain('MVP reminder channel is PWA Web Push');
    expect(sop).toContain('Supabase pg_cron invokes the protected route every minute');
    expect(sop).toContain('Do not use Resend/email for MVP reminder dispatch');
  });

  it('declares required web push provider and scheduler env names without committing secret values', () => {
    const env = readFileSync('.env.example', 'utf8');
    expect(env).toContain('NEXT_PUBLIC_VAPID_PUBLIC_KEY=');
    expect(env).toContain('VAPID_PUBLIC_KEY=');
    expect(env).toContain('VAPID_PRIVATE_KEY=');
    expect(env).toContain('VAPID_SUBJECT=');
    expect(env).toContain('CRON_SECRET=');
    expect(env).not.toMatch(/re_[A-Za-z0-9]/u);
  });



  it('registers a Supabase pg_cron scheduler for minute-level web push reminder checks without committed secrets', () => {
    const migration = readFileSync('supabase/migrations/202605190003_web_push_pg_cron_scheduler.sql', 'utf8');
    expect(migration).toContain('create extension if not exists pg_cron');
    expect(migration).toContain('create extension if not exists pg_net');
    expect(migration).not.toContain('create extension if not exists vault');
    expect(migration).toContain('cron.schedule');
    expect(migration.indexOf("cron.unschedule('fevio-reminder-check')")).toBeLessThan(migration.indexOf('cron.schedule'));
    expect(migration.match(/cron\.schedule\(/gu)).toHaveLength(1);
    expect(migration).toContain('fevio-reminder-check');
    expect(migration).toContain("'* * * * *'");
    expect(migration).toContain('net.http_post');
    expect(migration).toContain('/api/reminders/send-due');
    expect(migration).toContain('Authorization');
    expect(migration).toContain('Bearer');
    expect(migration).toContain('fevio_app_url');
    expect(migration).toContain('fevio_cron_secret');
    expect(migration).not.toMatch(/project-oznp0\.vercel\.app|sb_secret_|eyJ|Bearer\s+[A-Za-z0-9_-]{16,}/u);
  });

  it('adds an explicit table-level reminder dispatch unique constraint without a fire window column', () => {
    const migration = readFileSync('supabase/migrations/202605290001_reminder_dispatches_card_time_channel_unique.sql', 'utf8');
    expect(migration).toContain('reminder_dispatches_card_time_channel_unique');
    expect(migration).toContain('unique (card_id, scheduled_at, channel)');
    expect(migration).toContain('count(*) > 1');
    expect(migration).not.toMatch(/fire_window/iu);
  });

  it('extends reminder dispatch storage for web push T-60/T-15 channels and a raw-memo-free push candidate RPC', () => {
    const migration = readFileSync('supabase/migrations/202605190002_web_push_reminder_dispatches.sql', 'utf8');
    expect(migration).toContain("channel in ('email', 'web_push_t60', 'web_push_t15')");
    expect(migration).toContain('alter column recipient_email drop not null');
    expect(migration).toContain('get_due_web_push_reminder_candidates');
    expect(migration).toContain('p_channel text');
    expect(migration).toContain('jsonb_agg(ps.subscription)');
    expect(migration).toContain("c.card_type = 'injection'");
    expect(migration).not.toMatch(/source_text|raw_text|clinic_memo/iu);
  });

  it('tracks push delivery failure metadata without changing reminder RLS policies', () => {
    const migration = readFileSync('supabase/migrations/202605290003_push_delivery_failure_policy.sql', 'utf8');

    expect(migration).toContain('add column if not exists revoked_at timestamptz null');
    expect(migration).toContain('add column if not exists failed_at timestamptz null');
    expect(migration).toContain('add column if not exists failure_reason text null');
    expect(migration).toContain('ps.revoked_at is null');
    expect(migration).toContain('subscription_revoked');
    expect(migration).toContain('push_service_5xx_<code>');
    expect(migration).toContain('network_error_<code-or-kind>');
    expect(migration).not.toMatch(/create policy|alter policy|drop policy|disable row level security|raw_text|clinic_memo|source_text/iu);
  });

  it('records ADR 0028 as the no-retry push delivery failure policy', () => {
    const adr = readFileSync('docs/04-decisions/0028-push-delivery-failure-policy.md', 'utf8');

    expect(adr).toContain('Accepted');
    expect(adr).toContain('subscription_revoked');
    expect(adr).toContain('push_service_5xx_<code>');
    expect(adr).toContain('network_error_<code-or-kind>');
    expect(adr).toContain('알림 다시 받기');
    expect(adr).toContain('Do not enqueue an immediate retry');
    expect(adr).toContain('Creating a retry queue');
    expect(adr).toContain('Logging user id, endpoint, raw subscription JSON');
  });

  it('keeps legacy email dispatch storage documented while MVP uses web push candidates', () => {
    const migration = readFileSync('supabase/migrations/202605110003_reminder_dispatches.sql', 'utf8');
    expect(migration).toContain('unique (card_id, scheduled_at, channel)');
    expect(migration).toContain('get_due_email_reminder_candidates');
    expect(migration).toContain("c.card_type = 'injection'");
    expect(migration).not.toMatch(/source_text|raw_text/iu);
  });
});
