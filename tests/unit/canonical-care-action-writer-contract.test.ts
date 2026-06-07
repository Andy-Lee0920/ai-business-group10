import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['app', 'src'];
const WRITER = 'src/lib/canonical-care-action-writer.ts';

describe('canonical care action writer contract', () => {
  it('keeps care_action_cards creation centralized in the shared writer', () => {
    const directInsertFiles = sourceFiles(ROOTS)
      .filter((file) => file !== WRITER)
      .filter((file) => {
        const source = readFileSync(file, 'utf8');
        return /from\(['"]care_action_cards['"]\)[\s\S]{0,220}\.insert\(/u.test(source);
      });

    expect(directInsertFiles).toEqual([]);
  });
});

function sourceFiles(roots: string[]) {
  return roots.flatMap((root) => walk(root)).map((file) => relative(process.cwd(), file));
}

function walk(path: string): string[] {
  const entries = readdirSync(path);
  return entries.flatMap((entry) => {
    const fullPath = join(path, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return walk(fullPath);
    return /\.(ts|tsx)$/u.test(fullPath) ? [fullPath] : [];
  });
}
