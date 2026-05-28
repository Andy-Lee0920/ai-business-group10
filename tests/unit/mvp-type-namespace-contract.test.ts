import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const newMvpCodeRoots = [
  'src/features/records',
  'src/domain/couple-journal.ts',
  'src/domain/community-identity.ts',
  'src/domain/community-moderation.ts',
  'src/domain/community-empathy.ts',
  'src/types/journal.types.ts',
  'src/types/community.types.ts',
];

describe('MVP type namespace contract', () => {
  it('keeps the deprecated SLC type module as a compatibility re-export', () => {
    expect(existsSync('src/types/mvp.types.ts')).toBe(true);
    const shim = readFileSync('src/types/slc.types.ts', 'utf8');
    expect(shim).toContain('@deprecated');
    expect(shim).toContain("export * from './mvp.types'");
  });

  it('keeps new records/community/journal code off the deprecated SLC type namespace', () => {
    const offenders = collectFiles(newMvpCodeRoots).filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /from ['"][^'"]*slc\.types['"]/u.test(source);
    });

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
