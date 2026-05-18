import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('reminder infrastructure contract', () => {
  it('documents the protected scheduler route without adding a Vercel Hobby-blocking high-frequency cron', () => {
    const sop = readFileSync('docs/03-engineering/reminder-dispatch-sop.md', 'utf8');
    expect(sop).toContain('/api/reminders/send-due');
    expect(sop).toContain('Authorization: Bearer');
    expect(sop).toContain('email sending and external scheduler proof are not core to the current SLC');
    expect(sop).toContain('Vercel rejected `* * * * *`');
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

  it('stores email dispatches with a unique card-time-channel key and a raw-memo-free due-candidate RPC', () => {
    const migration = readFileSync('supabase/migrations/202605110003_reminder_dispatches.sql', 'utf8');
    expect(migration).toContain('unique (card_id, scheduled_at, channel)');
    expect(migration).toContain('get_due_email_reminder_candidates');
    expect(migration).toContain("c.card_type = 'injection'");
    expect(migration).not.toMatch(/source_text|raw_text/iu);
  });
});
