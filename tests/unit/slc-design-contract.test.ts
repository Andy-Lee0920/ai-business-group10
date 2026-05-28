import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SLC design contract', () => {
  it('defines the warm SLC design tokens and coral theme color', () => {
    expect(readFileSync('app/globals.css', 'utf8')).toContain('--slc-coral: #C95F4B');
    expect(readFileSync('app/globals.css', 'utf8')).toContain('--slc-coral-gradient: linear-gradient(135deg, #E97861 0%, #C95F4B 100%)');
    expect(readFileSync('app/layout.tsx', 'utf8')).toContain("themeColor: '#C95F4B'");
  });

  it('uses the cropped abdomen PNG instead of a placeholder or SVG fallback', () => {
    const confirmSheet = readFileSync('src/components/confirm-sheet.tsx', 'utf8');
    expect(confirmSheet).toContain('/assets/slc/abdomen-front.png');
    expect(confirmSheet).not.toContain('복부 실루엣');
    expect(confirmSheet).not.toContain('objectPosition');
  });
});
