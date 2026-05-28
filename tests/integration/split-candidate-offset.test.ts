import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = 'supabase/migrations';
const migrationName = '202605290002_split_candidates_source_offset.sql';
const migrationPath = join(migrationsDir, migrationName);

function migration() {
  return readFileSync(migrationPath, 'utf8');
}

describe('split candidate source offset integration contract', () => {
  it('adds nullable split_candidates source offset columns without changing RLS', () => {
    expect(readdirSync(migrationsDir)).toContain(migrationName);
    const sql = migration();

    expect(sql).toContain('add column if not exists source_offset_start int null');
    expect(sql).toContain('add column if not exists source_offset_end int null');
    expect(sql).toContain('NULL marks legacy rows');
    expect(sql).not.toContain('create policy');
    expect(sql).not.toContain('drop policy');
    expect(sql).not.toContain('enable row level security');
  });

  it('persists confirm_capture offsets from the confirmation payload', () => {
    const sql = migration();

    expect(sql).toContain('source_offset_start,');
    expect(sql).toContain('source_offset_end,');
    expect(sql).toContain("nullif(item->>'source_offset_start', '')::int");
    expect(sql).toContain("nullif(item->>'source_offset_end', '')::int");
  });
});
