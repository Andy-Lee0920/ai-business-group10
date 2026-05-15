import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SLC_CTA_STATE_CONTRACT, SLC_FORBIDDEN_VISIBLE_COPY, SLC_MOBILE_ROUTES, SLC_MOBILE_VIEWPORTS } from '../../src/domain/slc-mobile-quality';

const visibleSlcSources = [
  'app/privacy/page.tsx',
  'src/features/onboarding/onboarding-screen.tsx',
  'src/features/today/today-screen.tsx',
  'src/features/add/manual-add-form.tsx',
  'src/features/records/records-screen.tsx',
  'src/features/clinic-update/clinic-update-form.tsx',
  'src/features/partner/partner-view.tsx',
  'src/features/more/more-screen.tsx',
].map((file) => readFileSync(file, 'utf8')).join('\n');

describe('SLC mobile quality gate', () => {
  it('covers all requested SLC routes and iPhone 17 Pro/Max viewport targets', () => {
    expect(SLC_MOBILE_ROUTES).toEqual(['/privacy', '/onboarding', '/home', '/add', '/records', '/clinic-update', '/partner', '/more']);
    expect(SLC_MOBILE_VIEWPORTS.map((viewport) => viewport.width)).toEqual([390, 430]);
  });

  it('keeps internal development and backend copy out of visible SLC surfaces', () => {
    for (const forbidden of SLC_FORBIDDEN_VISIBLE_COPY) {
      expect(visibleSlcSources).not.toContain(forbidden);
    }
  });

  it('requires active and disabled CTA states to be distinguishable', () => {
    expect(SLC_CTA_STATE_CONTRACT.active.background).toBe('#C95F4B');
    expect(SLC_CTA_STATE_CONTRACT.disabled).toMatchObject({ requiresDisabledAttribute: true, opacityMax: 0.7 });
    expect(visibleSlcSources).toContain('disabled=');
    expect(visibleSlcSources).toMatch(/opacity: .*\?/);
  });

  it('keeps premium SLC forms away from native select webform controls', () => {
    expect(readFileSync('src/features/add/manual-add-form.tsx', 'utf8')).not.toContain('<select');
  });
});
