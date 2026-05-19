import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const scriptPath = 'scripts/archive-pwa-live-push-card.mjs';
const runbookPath = 'docs/qa/pwa-live-push-smoke.md';

describe('PWA live push synthetic card archive helper', () => {
  it('archives only synthetic live push smoke cards instead of deleting care history', () => {
    expect(existsSync(scriptPath)).toBe(true);
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('--card-id');
    expect(script).toContain('care_action_cards');
    expect(script).toContain("status: 'archived'");
    expect(script).toContain('synthetic live push smoke');
    expect(script).toContain('source_text');
    expect(script).toContain('description');
    expect(script).toContain('refuses to archive non-synthetic cards');
    expect(script).not.toContain('.delete(');
    expect(script).not.toContain('VAPID_PRIVATE_KEY');
  });

  it('documents cleanup as optional after evidence is captured', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    expect(runbook).toContain('scripts/archive-pwa-live-push-card.mjs');
    expect(runbook).toContain('node scripts/archive-pwa-live-push-card.mjs --card-id');
    expect(runbook).toContain('after evidence is captured');
  });
});
