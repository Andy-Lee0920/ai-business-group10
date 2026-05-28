import type { CardType } from '../types/care-cards.types';
import { inferCardType } from './care-cards';

export type KeywordReviewCorrection = {
  sourceText: string;
  userSelectedCardType: CardType;
};

export type KeywordReviewSummary = {
  total: number;
  unknownCount: number;
  unknownRatio: number;
  correctionCount: number;
  suggestedKeywords: string[];
};

const STOP_WORDS = new Set(['오늘', '내일', '오전', '오후', '확인', '해주세요', '하기', '그리고', '다음', '병원', '동안']);

export function summarizeKeywordReview(corrections: readonly KeywordReviewCorrection[]): KeywordReviewSummary {
  const total = corrections.length;
  const unknown = corrections.filter((item) => inferCardType(item.sourceText, 'my_action') === 'general_action');
  return {
    total,
    unknownCount: unknown.length,
    unknownRatio: total === 0 ? 0 : unknown.length / total,
    correctionCount: corrections.filter((item) => inferCardType(item.sourceText, 'my_action') !== item.userSelectedCardType).length,
    suggestedKeywords: collectKeywordCandidates(unknown.map((item) => item.sourceText)),
  };
}

function collectKeywordCandidates(values: readonly string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    for (const token of value.match(/[가-힣A-Za-z0-9]{2,}/gu) ?? []) {
      const normalized = token.toLowerCase();
      if (STOP_WORDS.has(normalized)) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([token]) => token);
}
