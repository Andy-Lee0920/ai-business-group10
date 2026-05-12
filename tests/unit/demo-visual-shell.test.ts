import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('demo visual shell contract', () => {
  it('uses a cinematic atmosphere layer with grain instead of a flat dashboard background', () => {
    const css = readFileSync('app/demo/dual-panel-demo.module.css', 'utf8');

    expect(css).toContain('.demoShell::before');
    expect(css).toContain('feTurbulence');
    expect(css).toContain('mix-blend-mode: soft-light');
    expect(css).toContain('.demoShell_coral');
    expect(css).toContain('.demoShell_sage');
    expect(css).toContain('.demoShell_lavender');
  });

  it('preserves generated demo panels as translucent material surfaces', () => {
    const css = readFileSync('app/demo/dual-panel-demo.module.css', 'utf8');

    expect(css).toContain('--fevio-card: rgba(255, 255, 255, 0.62)');
    expect(css).toContain('backdrop-filter: blur(24px)');
    expect(css).toContain('sourceBridge');
    expect(css).toContain('generatedHeader');
  });
});
