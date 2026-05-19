import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/verify-mvp-visible-delta-readiness.mjs';

describe('MVP visible delta readiness verifier', () => {
  it('is exposed as an npm command for local completion audits', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['verify:mvp:readiness']).toBe(`node ${scriptPath}`);
  });

  it('reports local readiness while preserving physical-device Reds as not complete', () => {
    const output = execFileSync('node', [scriptPath, '--offline'], { encoding: 'utf8' });

    expect(output).toContain('MVP visible delta local readiness verified');
    expect(output).toContain('Remaining Red: #382 Android physical live push evidence');
    expect(output).toContain('Remaining Red: #383 iOS Home Screen PWA physical live push evidence');
    expect(output).toContain('Do not mark goal complete from this readiness check alone');
  });
});
