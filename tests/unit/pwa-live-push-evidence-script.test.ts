import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/collect-pwa-live-push-evidence.mjs';
const runbookPath = 'docs/qa/pwa-live-push-smoke.md';

describe('PWA live push evidence helper', () => {
  it('collects masked DB evidence for live-device smoke without exposing push secrets', () => {
    expect(existsSync(scriptPath)).toBe(true);
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('--user-id');
    expect(script).toContain('--card-id');
    expect(script).toContain('push_subscriptions');
    expect(script).toContain('reminder_dispatches');
    expect(script).toContain('maskEndpoint');
    expect(script).toContain('maskProviderMessageId');
    expect(script).toContain('REMINDER_DISPATCH_SECRET');
    expect(script).toContain('/api/reminders/send-due');
    expect(script).not.toContain('subscription.keys');
    expect(script).not.toContain('VAPID_PRIVATE_KEY');
  });

  it('documents the helper in the Android/iOS live smoke runbook', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    expect(runbook).toContain('scripts/collect-pwa-live-push-evidence.mjs');
    expect(runbook).toContain('node scripts/collect-pwa-live-push-evidence.mjs --user-id');
    expect(runbook).toContain('endpoint/provider ids are masked');
  });
});
