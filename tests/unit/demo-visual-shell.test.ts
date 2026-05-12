import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('demo visual shell contract', () => {
  it('rejects the foggy visual rescue stack and keeps the shell clean', () => {
    const css = readFileSync('app/demo/dual-panel-demo.module.css', 'utf8');

    expect(css).toContain('/* P0 visual reset: clean iOS material shell. */');
    expect(css).toContain('.demoShell_coral');
    expect(css).toContain('.demoShell_sage');
    expect(css).toContain('.demoShell_lavender');
    expect(css).not.toContain('feTurbulence');
    expect(css).not.toContain('mix-blend-mode: soft-light');
    expect(css).not.toContain('backdrop-filter: blur(24px)');
    expect(css).not.toContain('rgba(255, 255, 255, 0.58)');
  });

  it('keeps generated demo copy and surrounding chrome product-safe', () => {
    const client = readFileSync('app/demo/dual-panel-demo-client.tsx', 'utf8');

    expect(client).toContain('source-to-care-bridge');
    expect(client).toContain('현재 단계');
    expect(client).not.toContain('Care state');
    expect(client).not.toContain('homeSurfaceLinks');
    expect(client).not.toContain('visibleEntrypointLinks');
    expect(client).not.toContain('Quick Capture');
    expect(client).not.toContain('Prescription Capture');
    expect(client).not.toContain('빠른 입력');
    expect(client).not.toContain('처방전 입력');
  });
});
