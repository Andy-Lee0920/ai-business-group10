import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('keyword review page stub (#60)', () => {
  it('exposes a privacy-safe quarterly keyword review surface without LLM automation', () => {
    const source = readFileSync('app/keyword-review/page.tsx', 'utf8');
    expect(source).toContain('IVF 키워드 리뷰 루프');
    expect(source).toContain('LLM 없이');
    expect(source).toContain('원문 전체나 민감한 메모를 노출하지');
    expect(source).toContain('summarizeKeywordReview');
  });
});
