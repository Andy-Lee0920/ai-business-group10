import { describe, expect, it } from 'vitest';
import { retrievePolicyEvidence } from '../../src/domain/policy-support-rag';

describe('static policy support RAG retrieval', () => {
  it('retrieves district-specific and Seoul fallback evidence for attention checks', () => {
    const evidence = retrievePolicyEvidence({
      sido: '서울특별시',
      sigungu: '동대문구',
      conditionChecks: [
        {
          item: '지원결정통지서',
          status: 'action_required',
          note: '통지서 확인 필요',
        },
        {
          item: '예산',
          status: 'needs_check',
          note: '예산 확인 필요',
        },
      ],
    });

    expect(evidence.map((item) => item.id)).toContain('dongdaemun-decision-notice');
    expect(evidence.map((item) => item.id)).toContain('budget-confirmation');
    expect(evidence.every((item) => item.sourceUrl.startsWith('https://'))).toBe(true);
  });

  it('does not retrieve unrelated confirmed topics', () => {
    const evidence = retrievePolicyEvidence({
      sido: '서울특별시',
      sigungu: '강남구',
      conditionChecks: [
        {
          item: '예산',
          status: 'confirmed',
          note: '확인됨',
        },
      ],
    });

    expect(evidence.map((item) => item.topic)).toContain('신청방법');
    expect(evidence.map((item) => item.topic)).not.toContain('예산');
  });
});
