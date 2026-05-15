import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SLC design contract', () => {
  it('defines the warm SLC design tokens and coral theme color', () => {
    expect(readFileSync('app/globals.css', 'utf8')).toContain('--slc-coral: #D95F4C');
    expect(readFileSync('app/globals.css', 'utf8')).toContain('--slc-coral-gradient: linear-gradient(135deg, #F47D63 0%, #D95F4C 100%)');
    expect(readFileSync('app/layout.tsx', 'utf8')).toContain("themeColor: '#D95F4C'");
  });

  it('uses the cropped abdomen PNG instead of a placeholder or SVG fallback', () => {
    const confirmSheet = readFileSync('src/components/confirm-sheet.tsx', 'utf8');
    expect(confirmSheet).toContain('/assets/slc/abdomen-front.png');
    expect(confirmSheet).not.toContain('복부 실루엣');
    expect(confirmSheet).not.toContain('objectPosition');
  });
});
