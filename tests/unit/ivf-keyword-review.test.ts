import { describe, expect, it } from 'vitest';
import { inferCardType } from '../../src/domain/care-cards';
import { summarizeKeywordReview } from '../../src/domain/ivf-keyword-review';

describe('Korean IVF keyword review loop (#60)', () => {
  it('covers expanded Korean IVF and community terms without an LLM', () => {
    expect(inferCardType('오늘 오가루트란 주사', 'my_action')).toBe('injection');
    expect(inferCardType('크리논 질정 자기 전', 'my_action')).toBe('medication');
    expect(inferCardType('내일 배아이식 전 채혈', 'my_action')).toBe('clinic_visit');
    expect(inferCardType('감자배아 기록 남김', 'my_action')).toBe('record');
  });

  it('summarizes privacy-safe correction candidates for quarterly review', () => {
    const summary = summarizeKeywordReview([
      { sourceText: '신선이식 설명 듣기', userSelectedCardType: 'clinic_visit' },
      { sourceText: '아침 루티너스', userSelectedCardType: 'medication' },
      { sourceText: '가볍게 산책', userSelectedCardType: 'general_action' },
    ]);

    expect(summary.total).toBe(3);
    expect(summary.unknownCount).toBeGreaterThanOrEqual(1);
    expect(summary.suggestedKeywords).not.toContain('오늘');
  });
});
