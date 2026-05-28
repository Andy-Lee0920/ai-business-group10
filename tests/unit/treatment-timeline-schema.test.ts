import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('TreatmentTimeline schema contract', () => {
  it('adds couple-scoped treatment cycle and milestone tables with RLS', () => {
    const migration = readFileSync('supabase/migrations/202605120001_treatment_timeline.sql', 'utf8');
    const matrix = readFileSync('docs/03-engineering/schema-rls-matrix.md', 'utf8');

    expect(migration).toContain('create table if not exists public.treatment_cycles');
    expect(migration).toContain('create table if not exists public.treatment_milestones');
    expect(migration).toContain('alter table public.treatment_cycles enable row level security');
    expect(migration).toContain('alter table public.treatment_milestones enable row level security');
    expect(migration).toContain('can_create_sensitive_rows');
    expect(migration).toContain('ensure_treatment_milestone_couple_matches_cycle');
    expect(migration).not.toContain('grant select, insert, update on public.treatment_cycles to anon');
    expect(matrix).toContain('`treatment_cycles`');
    expect(matrix).toContain('`treatment_milestones`');
  });
});
