import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  SLC_CTA_STATE_CONTRACT,
  SLC_FORBIDDEN_VISIBLE_COPY,
  SLC_HOME_FORBIDDEN_EMBRYO_COPY,
  SLC_MOBILE_ROUTES,
  SLC_MOBILE_VIEWPORTS,
  SLC_STANDALONE_CAPTURE_ROUTES,
} from '../../src/domain/slc-mobile-quality';

const visibleSlcSources = [
  'app/privacy/page.tsx',
  'src/features/onboarding/onboarding-screen.tsx',
  'src/features/today/today-screen.tsx',
  'src/features/add/manual-add-form.tsx',
  'src/features/records/records-screen.tsx',
  'src/features/clinic-update/clinic-update-form.tsx',
  'src/features/partner/partner-view.tsx',
  'src/features/more/more-screen.tsx',
  'app/onboard/prescription-capture/prescription-capture-client.tsx',
  'app/onboard/quick-capture/quick-capture-client.tsx',
  'app/onboard/full-setup/page.tsx',
].map((file) => readFileSync(file, 'utf8')).join('\n');

const homeOperationSources = [
  'src/features/today/today-screen.tsx',
  'src/features/today/presentation-home-demo.tsx',
  'src/features/today/home-page-loader.tsx',
].map((file) => readFileSync(file, 'utf8')).join('\n');

describe('SLC mobile quality gate', () => {
  it('covers all requested SLC routes and iPhone 17 Pro/Max viewport targets', () => {
    expect(SLC_MOBILE_ROUTES).toEqual(['/privacy', '/onboarding', '/home', '/care-agent', '/add', '/records', '/clinic-update', '/partner', '/more']);
    expect(SLC_MOBILE_VIEWPORTS.map((viewport) => viewport.width)).toEqual([390, 430]);
  });

  it('keeps internal development and backend copy out of visible SLC surfaces', () => {
    for (const forbidden of SLC_FORBIDDEN_VISIBLE_COPY) {
      expect(visibleSlcSources).not.toContain(forbidden);
    }
  });

  it('keeps /home from becoming an embryo progress tracker', () => {
    for (const forbidden of SLC_HOME_FORBIDDEN_EMBRYO_COPY) {
      expect(homeOperationSources).not.toContain(forbidden);
    }
    expect(homeOperationSources).toContain('data-testid="home-operation-screen"');
    expect(homeOperationSources).toContain('다음 예정 항목');
    expect(homeOperationSources).toContain('오늘 확인할 항목');
  });

  it('requires active and disabled CTA states to be distinguishable', () => {
    expect(SLC_CTA_STATE_CONTRACT.active.background).toBe('#D95F4C');
    expect(SLC_CTA_STATE_CONTRACT.disabled).toMatchObject({ requiresDisabledAttribute: true, opacityMax: 0.7 });
    expect(visibleSlcSources).toContain('disabled=');
    expect(visibleSlcSources).toMatch(/opacity: .*\?/);
  });

  it('keeps premium SLC forms away from native select webform controls', () => {
    expect(readFileSync('src/features/add/manual-add-form.tsx', 'utf8')).not.toContain('<select');
  });

  it('keeps standalone capture pages recoverable when a user enters by mistake', () => {
    expect(SLC_STANDALONE_CAPTURE_ROUTES).toEqual([
      '/onboard/prescription-capture',
      '/onboard/quick-capture',
      '/onboard/full-setup',
    ]);
    for (const file of [
      'app/onboard/prescription-capture/prescription-capture-client.tsx',
      'app/onboard/quick-capture/quick-capture-client.tsx',
      'app/onboard/full-setup/page.tsx',
    ]) {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain('aria-label="홈으로 돌아가기"');
      expect(source).toContain('href="/home"');
    }
  });
});
