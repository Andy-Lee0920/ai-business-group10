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
    expect(env).toContain('REMINDER_DISPATCH_SECRET=');
    expect(env).toContain('CRON_SECRET=');
    expect(env).not.toMatch(/re_[A-Za-z0-9]/u);
  });



  it('registers a Supabase pg_cron scheduler for minute-level web push reminder checks without committed secrets', () => {
    const migration = readFileSync('supabase/migrations/202605190003_web_push_pg_cron_scheduler.sql', 'utf8');
    expect(migration).toContain('create extension if not exists pg_cron');
    expect(migration).toContain('create extension if not exists pg_net');
    expect(migration).not.toContain('create extension if not exists vault');
    expect(migration).toContain('cron.schedule');
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

  it('extends reminder dispatch storage for web push T-60/T-15 channels and a raw-memo-free push candidate RPC', () => {
    const migration = readFileSync('supabase/migrations/202605190002_web_push_reminder_dispatches.sql', 'utf8');
    const medicationMigration = readFileSync('supabase/migrations/202605290001_medication_push_reminder_candidates.sql', 'utf8');
    const pushFunction = medicationMigration.slice(
      medicationMigration.indexOf('create function public.get_due_web_push_reminder_candidates'),
      medicationMigration.indexOf('grant execute on function public.get_due_web_push_reminder_candidates'),
    );
    const emailFunction = medicationMigration.slice(
      medicationMigration.indexOf('create function public.get_due_email_reminder_candidates'),
      medicationMigration.indexOf('grant execute on function public.get_due_email_reminder_candidates'),
    );
    expect(migration).toContain("channel in ('email', 'web_push_t60', 'web_push_t15')");
    expect(migration).toContain('alter column recipient_email drop not null');
    expect(migration).toContain('get_due_web_push_reminder_candidates');
    expect(migration).toContain('p_channel text');
    expect(migration).toContain('jsonb_agg(ps.subscription)');
    expect(pushFunction).toContain("c.card_type in ('injection', 'medication')");
    expect(emailFunction).toContain("c.card_type = 'injection'");
    expect(medicationMigration).toContain('card_type text');
    expect(medicationMigration).toContain('get_due_email_reminder_candidates');
    expect(`${migration}\n${medicationMigration}`).not.toMatch(/source_text|raw_text|clinic_memo/iu);
  });

  it('keeps legacy email dispatch storage documented while MVP uses web push candidates', () => {
    const migration = readFileSync('supabase/migrations/202605110003_reminder_dispatches.sql', 'utf8');
    expect(migration).toContain('unique (card_id, scheduled_at, channel)');
    expect(migration).toContain('get_due_email_reminder_candidates');
    expect(migration).toContain("c.card_type = 'injection'");
    expect(migration).not.toMatch(/source_text|raw_text/iu);
  });

  it('replaces direct partner action RPC output with the safe partner view contract', () => {
    const migration = readFileSync('supabase/migrations/202605290002_safe_partner_action_view.sql', 'utf8');
    const returnsTable = migration.slice(migration.indexOf('returns table'), migration.indexOf('language sql'));

    expect(migration).toContain('drop function if exists public.get_partner_action_view(text)');
    expect(returnsTable).toContain('safe_id text');
    expect(returnsTable).toContain('scheduled_at timestamptz');
    expect(returnsTable).toContain('card_type text');
    expect(returnsTable).toContain('display_state text');
    expect(returnsTable).toContain('sharing_scope text');
    expect(returnsTable).not.toMatch(/title|description|source_text|raw_memo/iu);
    expect(migration).toContain('grant execute on function public.get_partner_action_view(text) to anon, authenticated');
    expect(migration).toContain('resolve_partner_action_card_id');
    expect(migration).toContain('grant execute on function public.resolve_partner_action_card_id(text, text) to service_role');
    expect(migration).not.toContain('grant execute on function public.resolve_partner_action_card_id(text, text) to anon, authenticated');
    expect(migration).toContain('record_partner_assist_by_safe_id');
    expect(migration).toContain('returns table(card_safe_id text, partner_assist_at timestamptz)');
    expect(migration).toContain("left(encode(digest(c.id::text, 'sha256'), 'hex'), 16)");
  });
});
