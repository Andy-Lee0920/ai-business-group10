import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const globals = () => readFileSync('app/globals.css', 'utf8');
const authedLayout = () => readFileSync('app/(authed)/layout.tsx', 'utf8');
const bottomNav = () => readFileSync('src/components/bottom-nav.tsx', 'utf8');
const postClinicBanner = () => readFileSync('src/components/post-clinic-banner.tsx', 'utf8');
const confirmSheet = () => readFileSync('src/components/confirm-sheet.tsx', 'utf8');

describe('iPhone Safari mobile frame contract', () => {
  it('centralizes authed mobile frame and safe-area spacing tokens', () => {
    const css = globals();
    expect(css).toContain('--fevio-mobile-frame-max: var(--fevio-phone-frame-max)');
    expect(css).toContain('--fevio-page-gutter: clamp(16px, 5.13vw, 24px)');
    expect(css).toContain('--fevio-bottom-nav-height: calc(78px + env(safe-area-inset-bottom, 0px))');
    expect(css).toContain('--fevio-page-bottom: calc(var(--fevio-bottom-nav-height) + 22px)');
    expect(css).toContain('.fevio-authed-frame');
    expect(css).toContain('.fevio-authed-main');
  });

  it('uses the shared frame for authed layout, bottom navigation, and fixed overlays', () => {
    expect(authedLayout()).toContain('className="fevio-authed-frame"');
    expect(authedLayout()).toContain('className="fevio-authed-main"');
    expect(bottomNav()).toContain("maxWidth: 'var(--fevio-mobile-frame-max)'");
    expect(bottomNav()).toContain("minHeight: 'var(--fevio-bottom-nav-height)'");
    expect(postClinicBanner()).toContain("maxWidth: 'var(--fevio-mobile-frame-max)'");
    expect(postClinicBanner()).toContain("bottom: 'calc(var(--fevio-bottom-nav-height) + 8px)'");
    expect(confirmSheet()).toContain("maxWidth: 'var(--fevio-mobile-frame-max)'");
  });

  it('documents the mobile frame decision in DESIGN.md', () => {
    const design = readFileSync('DESIGN.md', 'utf8');
    expect(design).toContain('iPhone Safari frame uses shared `--fevio-page-*`');
    expect(design).toContain('Safari dynamic viewport (`100dvh`)');
  });
});
