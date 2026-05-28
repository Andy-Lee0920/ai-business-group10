import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/prepare-pwa-live-push-card.mjs';
const runbookPath = 'docs/qa/pwa-live-push-smoke.md';

describe('PWA live push test card preparation helper', () => {
  it('creates a synthetic confirmed injection care_action_card in a reminder window', () => {
    expect(existsSync(scriptPath)).toBe(true);
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('--user-id');
    expect(script).toContain('--offset-minutes');
    expect(script).toContain('care_action_cards');
    expect(script).toContain('couple_members');
    expect(script).toContain('couple_states');
    expect(script).toContain('privacy_gate_accepted_at');
    expect(script).toContain("card_type: 'injection'");
    expect(script).toContain("status: 'confirmed'");
    expect(script).toContain("partner_visible: true");
    expect(script).toContain('synthetic live push smoke');
    expect(script).not.toContain('delete(');
    expect(script).not.toContain('VAPID_PRIVATE_KEY');
  });

  it('adds the preparation command to the live smoke runbook', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    expect(runbook).toContain('npm run smoke:push:prepare -- --user-id');
    expect(runbook).toContain('synthetic confirmed injection card');
  });
});
