import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationPath = 'supabase/migrations/202605120004_patient_sharing_scope.sql';

describe('Patient-owned sharing scope schema contract', () => {
  it('persists basic/care/emotional scope and feeds partner projection from membership state', () => {
    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('create or replace function public.get_patient_sharing_scope');
    expect(migration).toContain('create or replace function public.set_patient_sharing_scope');
    expect(migration).toContain("p_scope in ('basic', 'care', 'emotional')");
    expect(migration).toContain('update public.care_memberships');
    expect(migration).toContain('role = \'patient\'');
    expect(migration).toContain('partner_connected');
    expect(migration).toContain('drop function if exists public.get_partner_action_view(text)');
    expect(migration).toContain('sharing_scope text');
    expect(migration).toContain('grant execute on function public.set_patient_sharing_scope(text) to authenticated');
  });
});
