import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/collect-pwa-live-push-evidence.mjs';
const runbook = readFileSync('docs/qa/pwa-live-push-smoke.md', 'utf8');

describe('PWA live push GitHub evidence comment formatting', () => {
  it('lets live-device testers generate Android/iOS issue comments from masked evidence', () => {
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('--format');
    expect(script).toContain('github-comment');
    expect(script).toContain('--platform');
    expect(script).toContain('formatGithubComment');
    expect(script).toContain('Android live smoke Green/Red update');
    expect(script).toContain('iOS Home Screen PWA live smoke Green/Red update');
    expect(script).toContain('L1 push_subscriptions');
    expect(script).toContain('L7 dedup');
    expect(script).toContain('Red remaining, if any');
    expect(script).not.toContain('VAPID_PRIVATE_KEY');
  });

  it('documents comment output in the live smoke runbook without weakening the Red', () => {
    expect(runbook).toContain('--format github-comment --platform android');
    expect(runbook).toContain('--format github-comment --platform ios');
    expect(runbook).toContain('Attach real-device screenshots or videos before closing');
  });
});
