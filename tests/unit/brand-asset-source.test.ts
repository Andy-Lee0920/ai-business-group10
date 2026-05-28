import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('brand asset source contract', () => {
  it('keeps logo accessible and Korean-font-first rather than Inter-first', () => {
    const logo = readFileSync('public/logo.svg', 'utf8');
    expect(logo).toContain('<title');
    expect(logo).toContain('<desc');
    expect(logo).toContain('#F6F4F1');
    expect(logo).toContain('#6F8F6E');
    expect(logo).not.toMatch(/font-family="Inter,/u);
    expect(logo).toMatch(/font-family="'Noto Sans KR'/u);
  });

  it('documents reproducible brand asset sources and Korean glyph constraints', () => {
    const doc = readFileSync('docs/design/brand-assets-source.md', 'utf8');
    expect(doc).toContain('public/og-image.png');
    expect(doc).toContain('src/design/assets.ts');
    expect(doc).toContain('Korean-capable font stack');
    expect(doc).toContain('must not depend on missing Korean glyph rendering');
  });
});
