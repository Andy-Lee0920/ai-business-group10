import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/verify-live-push-device-readiness.mjs';

const androidOutput = 'List of devices attached\nR58N1234567\tdevice\n';
const iosOutput = `== Devices ==
MacBook Pro (00000000-0000-0000-0000-000000000000)
iPhone 15 Pro (17.5) (00008120-0012345678901234)
`;

describe('live push physical device readiness verifier', () => {
  it('is exposed as an npm command for preflight live-smoke checks', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['verify:push:devices']).toBe(`node ${scriptPath}`);
  });

  it('passes when Android and iOS physical-device outputs are present', () => {
    const output = execFileSync('node', [
      scriptPath,
      '--android-output', androidOutput,
      '--ios-output', iosOutput,
    ], { encoding: 'utf8' });

    expect(output).toContain('Android physical device: READY');
    expect(output).toContain('iOS physical device: READY');
    expect(output).toContain('live push device readiness passed');
  });

  it('fails with explicit #382/#383 blockers when physical devices are missing', () => {
    const result = spawnSync('node', [
      scriptPath,
      '--android-output', 'List of devices attached\n\n',
      '--ios-output', '== Devices ==\nMacBook Pro (00000000-0000-0000-0000-000000000000)\n',
    ], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('#382 blocked: no Android physical device detected');
    expect(result.stderr).toContain('#383 blocked: no iOS physical device detected');
  });
});
