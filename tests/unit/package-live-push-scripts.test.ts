import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
const runbook = readFileSync('docs/qa/pwa-live-push-smoke.md', 'utf8');

describe('package live push smoke scripts', () => {
  it('exposes npm entrypoints for prepare, evidence, and archive helpers', () => {
    expect(packageJson.scripts?.['smoke:push:prepare']).toBe('node scripts/prepare-pwa-live-push-card.mjs');
    expect(packageJson.scripts?.['smoke:push:evidence']).toBe('node scripts/collect-pwa-live-push-evidence.mjs');
    expect(packageJson.scripts?.['smoke:push:archive']).toBe('node scripts/archive-pwa-live-push-card.mjs');
  });

  it('documents npm pass-through usage in the live smoke runbook', () => {
    expect(runbook).toContain('npm run smoke:push:prepare -- --user-id');
    expect(runbook).toContain('npm run smoke:push:evidence -- --user-id');
    expect(runbook).toContain('npm run smoke:push:archive -- --card-id');
  });
});
