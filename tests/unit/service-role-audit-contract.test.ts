import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = 'supabase/migrations/202605200002_service_role_audit_logs.sql';

describe('service-role audit seam', () => {
  it('centralizes service-role factory and exposes audited access helpers from server-supabase', () => {
    const source = readFileSync('src/lib/server-supabase.ts', 'utf8');

    expect(source).toContain('requireSupabaseServiceRoleKey');
    expect(source).toContain('createSupabaseServiceRoleClient');
    expect(source).toContain('createAuditedSupabaseServiceRoleClient');
    expect(source).toContain('recordServiceRoleAuditEvent');
    for (const field of ['actor', 'route', 'target_type', 'target_id', 'action', 'ts']) {
      expect(source).toContain(field);
    }
  });

  it('keeps the legacy admin module as a compatibility re-export only', () => {
    const source = readFileSync('src/lib/server-supabase-admin.ts', 'utf8');

    expect(source).toContain('@deprecated');
    expect(source).toContain("export * from './server-supabase'");
    expect(source).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(source).not.toContain('createClient(');
  });

  it('adds a server-side audit log migration without authenticated direct grants', () => {
    expect(existsSync(migration)).toBe(true);
    const sql = readFileSync(migration, 'utf8');

    expect(sql).toContain('create table if not exists public.service_role_audit_logs');
    expect(sql).toContain('actor text not null');
    expect(sql).toContain('route text not null');
    expect(sql).toContain('target_type text not null');
    expect(sql).toContain('target_id text');
    expect(sql).toContain('action text not null');
    expect(sql).toContain('ts timestamptz not null default now()');
    expect(sql).toContain('alter table public.service_role_audit_logs enable row level security');
    expect(sql).not.toContain('grant select');
    expect(sql).not.toContain('grant insert');
  });

  it('keeps service-role env access out of app routes and client-facing source folders', () => {
    const offenders = collectFiles(['app', 'src/components', 'src/features', 'src/domain'])
      .filter((file) => readFileSync(file, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'));

    expect(offenders).toEqual([]);
  });
});

function collectFiles(paths: string[]): string[] {
  return paths.flatMap((path) => walk(path));
}

function walk(path: string): string[] {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return /\.(ts|tsx)$/u.test(path) ? [path] : [];
  return readdirSync(path)
    .filter((entry) => !entry.startsWith('.') && entry !== 'node_modules')
    .flatMap((entry) => walk(join(path, entry)));
}
