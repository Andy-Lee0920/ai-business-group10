import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Care OS schema contract', () => {
  it('adds membership, sharing scope, assist permission, and injection ledger structures', () => {
    const migration = readFileSync('supabase/migrations/202605120002_care_os_architecture.sql', 'utf8');
    const matrix = readFileSync('docs/03-engineering/schema-rls-matrix.md', 'utf8');

    expect(migration).toContain('create table if not exists public.care_memberships');
    expect(migration).toContain("role text not null check (role in ('patient', 'partner'))");
    expect(migration).toContain("sharing_scope text not null default 'care'");
    expect(migration).toContain("permission_level text not null default 'read'");
    expect(migration).toContain('create table if not exists public.injection_logs');
    expect(migration).toContain('administered_by');
    expect(migration).toContain('recorded_by');
    expect(migration).toContain('confirmed_by_patient boolean not null default false');
    expect(migration).toContain('record_partner_assisted_injection');
    expect(migration).toContain('confirm_injection_log_by_patient');
    expect(migration).toContain('alter table public.care_memberships enable row level security');
    expect(migration).toContain('alter table public.injection_logs enable row level security');
    expect(matrix).toContain('`care_memberships`');
    expect(matrix).toContain('`injection_logs`');
  });
});
