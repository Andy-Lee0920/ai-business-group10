import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationPath = 'supabase/migrations/202605120003_partner_account_join.sql';

describe('Partner account join schema contract', () => {
  it('adds single-use partner invite acceptance into care cycle membership', () => {
    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('alter table public.partner_share_links');
    expect(migration).toContain('accepted_by uuid references auth.users(id)');
    expect(migration).toContain('accepted_at timestamptz');
    expect(migration).toContain('create or replace function public.accept_partner_share_invite');
    expect(migration).toContain('partner_invite_own_link');
    expect(migration).toContain('partner_invite_expired');
    expect(migration).toContain('partner_invite_already_used');
    expect(migration).toContain('insert into public.care_memberships');
    expect(migration).toContain("'partner'");
    expect(migration).toContain("'assist_action'");
    expect(migration).toContain('grant execute on function public.accept_partner_share_invite(text) to authenticated');
  });
});
