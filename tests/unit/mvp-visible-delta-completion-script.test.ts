import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/verify-mvp-visible-delta-completion.mjs';

describe('MVP visible delta completion verifier', () => {
  it('is exposed as an npm command separate from readiness', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['verify:mvp:complete']).toBe(`node ${scriptPath}`);
  });

  it('fails without Android and iOS physical evidence bundles', () => {
    const result = spawnSync('node', [scriptPath, '--offline'], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('missing required completion evidence: --android-evidence-json');
    expect(result.stderr).toContain('missing required completion evidence: --ios-evidence-json');
    expect(result.stderr).toContain('Do not mark the goal complete');
  });
});
