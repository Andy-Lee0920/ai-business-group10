import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/create-live-push-evidence-bundle.mjs';
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

describe('live push evidence bundle scaffold', () => {
  it('exposes a command that creates a checklist folder for Android/iOS physical smoke evidence', () => {
    expect(packageJson.scripts?.['smoke:push:bundle']).toBe('node scripts/create-live-push-evidence-bundle.mjs');
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('creates a platform-specific README with all required media filenames and commands', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fevio-push-bundle-'));

    const output = execFileSync('node', [scriptPath, '--platform', 'ios', '--out-dir', dir], { encoding: 'utf8' });
    const readme = readFileSync(join(dir, 'ios-live-push-evidence', 'README.md'), 'utf8');

    expect(output).toContain('ios-live-push-evidence');
    expect(readme).toContain('npm run smoke:pwa:production');
    expect(readme).toContain('npm run smoke:push:prepare');
    expect(readme).toContain('npm run smoke:push:evidence');
    expect(readme).toContain('npm run verify:push:closure');
    expect(readme).toContain('npm run verify:mvp:complete');
    expect(readme).toContain('--ios-evidence-json ios-live-push-evidence/evidence.json');
    expect(readme).toContain('--android-evidence-json android-live-push-evidence/evidence.json');
    expect(readme).toContain('ios-homescreen.png');
    expect(readme).toContain('l3-notification.png');
    expect(readme).toContain('l4-home.png');
    expect(readme).toContain('l6-lockscreen.mov');
    expect(readme).toContain('Do not close #383');
  });
});
