import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('legacy keyword review route', () => {
  it('is disabled for SLC and redirects to the Today execution loop', () => {
    const source = readFileSync('app/keyword-review/page.tsx', 'utf8');
    expect(source).toContain("redirect('/home')");
    expect(source).not.toContain('summarizeKeywordReview');
  });
});
