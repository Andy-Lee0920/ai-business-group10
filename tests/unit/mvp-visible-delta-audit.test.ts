import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const auditPath = 'docs/qa/mvp-visible-delta-audit.md';

describe('MVP visible delta completion audit', () => {
  it('maps every explicit goal slice to evidence and preserves remaining Reds', () => {
    const audit = readFileSync(auditPath, 'utf8');

    for (const issue of ['#376', '#377', '#379', '#380', '#382', '#383', '#384', '#385', '#386', '#387', '#388']) {
      expect(audit).toContain(issue);
    }

    for (const artifact of [
      'ADR0013',
      'ADR0014',
      'split_candidates → care_action_cards',
      'care_action_cards primary',
      'partner_assist_at',
      'WINDOW_RADIUS_MINUTES = 5',
      '(card_id, scheduled_at, channel)',
      'medication reference image',
      'Home Screen PWA',
      'gesture-bound',
      'docs/qa/pwa-live-push-smoke.md',
      'scripts/compare-openrouter-vision-models.mjs',
      'npm run smoke:pwa:production',
      'scripts/verify-production-pwa-prereqs.mjs',
      'github-comment',
      'scripts/verify-live-push-closure-evidence.mjs',
      'verify:push:closure',
      '165 files / 617 tests',
    ]) {
      expect(audit).toContain(artifact);
    }

    expect(audit).toContain('Do not mark the goal complete');
    expect(audit).toContain('OPENROUTER_API_KEY');
    expect(audit).toContain('real Android device');
    expect(audit).toContain('real iPhone Home Screen PWA');
    expect(audit).toContain('Gemini 20/20');
    expect(audit).not.toMatch(/VAPID_PRIVATE_KEY\s*=|Bearer [A-Za-z0-9._-]+/u);
  });
});
