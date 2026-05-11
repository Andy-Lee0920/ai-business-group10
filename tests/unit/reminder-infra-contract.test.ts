import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('reminder infrastructure contract', () => {
  it('documents the protected scheduler route without adding a Vercel Hobby-blocking high-frequency cron', () => {
    const sop = readFileSync('docs/03-engineering/reminder-dispatch-sop.md', 'utf8');
    expect(sop).toContain('/api/reminders/send-due');
    expect(sop).toContain('Authorization: Bearer');
    expect(sop).toContain('Vercel rejected `* * * * *`');
  });

  it('declares required provider and scheduler env names without committing secret values', () => {
    const env = readFileSync('.env.example', 'utf8');
    expect(env).toContain('RESEND_API_KEY=');
    expect(env).toContain('REMINDER_FROM_EMAIL=');
    expect(env).toContain('REMINDER_DISPATCH_SECRET=');
    expect(env).toContain('CRON_SECRET=');
    expect(env).not.toMatch(/re_[A-Za-z0-9]/u);
  });

  it('stores email dispatches with a unique card-time-channel key and a raw-memo-free due-candidate RPC', () => {
    const migration = readFileSync('supabase/migrations/202605110003_reminder_dispatches.sql', 'utf8');
    expect(migration).toContain('unique (card_id, scheduled_at, channel)');
    expect(migration).toContain('get_due_email_reminder_candidates');
    expect(migration).toContain("c.card_type = 'injection'");
    expect(migration).not.toMatch(/source_text|raw_text/iu);
  });
});
