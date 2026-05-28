import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const runbookPath = 'docs/qa/pwa-live-push-smoke.md';

describe('PWA live push smoke runbook', () => {
  it('documents the Android and iOS live evidence gates without secrets or clinic payloads', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    expect(runbook).toContain('# Fevio PWA live push smoke runbook');
    expect(runbook).toContain('Android Chrome');
    expect(runbook).toContain('iPhone Home Screen PWA');
    expect(runbook).toContain('L1');
    expect(runbook).toContain('L2');
    expect(runbook).toContain('L3');
    expect(runbook).toContain('L4');
    expect(runbook).toContain('L6');
    expect(runbook).toContain('L7');
    expect(runbook).toContain('Add to Home Screen');
    expect(runbook).toContain('gesture-bound');
    expect(runbook).toContain('endpoint masked');
    expect(runbook).toContain('(card_id, scheduled_at, channel)');
    expect(runbook).toContain('Do not close #382');
    expect(runbook).toContain('Do not close #383');

    expect(runbook).toContain('Do not expose raw clinic memo');
    expect(runbook).not.toMatch(/VAPID_PRIVATE_KEY\s*=|OPENROUTER_API_KEY\s*=|Bearer [A-Za-z0-9._-]+/u);
  });
});
