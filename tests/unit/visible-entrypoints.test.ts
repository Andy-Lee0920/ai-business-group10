import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Vercel-visible entrypoints', () => {
  it('exposes Quick Capture and Prescription Capture from the home surface without leaking them into the demo phone funnel', () => {
    const launcher = readFileSync('src/features/adaptive-home/home-utility-launcher.tsx', 'utf8');
    const demo = readFileSync('app/demo/dual-panel-demo-client.tsx', 'utf8');

    expect(launcher).toContain('quick-capture-entrypoint');
    expect(launcher).toContain('/onboard/quick-capture');
    expect(launcher).toContain('prescription-capture-entrypoint');
    expect(launcher).toContain('/onboard/prescription-capture');
    expect(demo).not.toContain('/onboard/quick-capture');
    expect(demo).not.toContain('/onboard/prescription-capture');
  });

  it('uses a real photo input and confirmation screen for capture flows', () => {
    const quick = readFileSync('app/onboard/quick-capture/quick-capture-client.tsx', 'utf8');
    const prescription = readFileSync('app/onboard/prescription-capture/prescription-capture-client.tsx', 'utf8');

    expect(quick).toContain('type="file"');
    expect(quick).toContain('accept="image/*"');
    expect(quick).toContain('저장됐어요');
    expect(prescription).toContain('type="file"');
    expect(prescription).toContain('/api/onboard/photo-upload');
    expect(prescription).toContain('/api/onboard/photo-analyze');
    expect(prescription).toContain('/api/onboard/text-analyze');
    expect(prescription).toContain('/api/onboard/candidates/confirm');
    expect(prescription).toContain('확인 후 저장');
  });
});
