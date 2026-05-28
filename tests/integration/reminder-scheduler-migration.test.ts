import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('reminder scheduler migration', () => {
  it('replays pg_cron registration as one named active job', () => {
    const migration = readFileSync('supabase/migrations/202605190003_web_push_pg_cron_scheduler.sql', 'utf8');
    const unscheduleIndex = migration.indexOf("cron.unschedule('fevio-reminder-check')");
    const scheduleIndex = migration.indexOf('cron.schedule');

    expect(unscheduleIndex).toBeGreaterThanOrEqual(0);
    expect(scheduleIndex).toBeGreaterThan(unscheduleIndex);
    expect(migration.match(/cron\.schedule\(/gu)).toHaveLength(1);
    expect(migration).toContain("where jobname = 'fevio-reminder-check'");
  });
});
