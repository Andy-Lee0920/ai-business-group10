import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const runtimeRoots = ['app', 'src'];
const forbiddenRuntimePatterns = [
  /\breceipts?\b/iu,
  /\bReceipt\b/u,
  /\bfinancial\b/iu,
  /\bFinancial\b/u,
  /\bsubsidy\b/iu,
  /\bSubsidy\b/u,
  /CostLineChart/u,
  /정부지원금/u,
  /영수증/u,
];
const allowedFiles = new Set<string>([
  // Historical DB/migration/docs/tests may mention receipts; product runtime must not.
]);

describe('records billing deprecation contract', () => {
  it('keeps receipt/financial/subsidy artifacts out of product runtime code', () => {
    expect(existsSync('app/api/receipts')).toBe(false);

    const offenders = collectRuntimeFiles(runtimeRoots)
      .filter((file) => !allowedFiles.has(file))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        return forbiddenRuntimePatterns
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${file} :: ${pattern.source}`);
      });

    expect(offenders).toEqual([]);
  });
});

function collectRuntimeFiles(roots: string[]): string[] {
  return roots.flatMap((root) => walk(root));
}

function walk(path: string): string[] {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (stat.isFile()) return /\.(ts|tsx)$/u.test(path) ? [path] : [];
  return readdirSync(path)
    .filter((entry) => !entry.startsWith('.') && entry !== 'node_modules')
    .flatMap((entry) => walk(join(path, entry)));
}
