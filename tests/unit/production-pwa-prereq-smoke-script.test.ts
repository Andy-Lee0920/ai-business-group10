import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/verify-production-pwa-prereqs.mjs';
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
const runbook = readFileSync('docs/qa/pwa-live-push-smoke.md', 'utf8');

describe('production PWA prerequisite smoke script', () => {
  it('exposes a production-safe smoke command before physical Android/iOS live testing', () => {
    expect(packageJson.scripts?.['smoke:pwa:production']).toBe('node scripts/verify-production-pwa-prereqs.mjs');
    expect(existsSync(scriptPath)).toBe(true);
  });

  it('checks deployed manifest, service worker, and auth-safe push endpoints without sending notifications', () => {
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('/manifest.json');
    expect(script).toContain('/sw.js');
    expect(script).toContain('/api/push/subscribe');
    expect(script).toContain('/api/reminders/send-due');
    expect(script).toContain('assertManifest');
    expect(script).toContain('assertServiceWorker');
    expect(script).toContain('assertAuthSafePushRoutes');
    expect(script).toContain('display');
    expect(script).toContain('standalone');
    expect(script).toContain('notificationclick');
    expect(script).not.toContain('REMINDER_DISPATCH_SECRET');
    expect(script).not.toContain('VAPID_PRIVATE_KEY');
  });

  it('documents the production prerequisite smoke as not replacing device evidence', () => {
    expect(runbook).toContain('npm run smoke:pwa:production');
    expect(runbook).toContain('does not replace live-device evidence');
  });
});
