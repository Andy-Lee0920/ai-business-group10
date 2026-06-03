import { describe, expect, it } from 'vitest';
import {
  isPolicyInquiryDraftSafe,
  polishPolicyInquiryDraft,
} from '../../src/domain/policy-support-polish';
import type { PolicyEvidence } from '../../src/domain/policy-support-rag';
import type { PolicyInquiryDraft, PolicySupportResult } from '../../src/domain/policy-support';

const deterministicDraft = {
  recipient: 'familycare@example.kr',
  subject: '난임부부 시술비 지원 신청 가능 여부 문의드립니다',
  bodyLines: [
    '안녕하세요.',
    '서울특별시 강남구 거주자로, 체외수정 신선배아 시술을 2026-06-10경 시작 예정입니다.',
    '- 시술 전에 지원결정통지서 발급이 가능한가요?',
    '감사합니다.',
  ],
} as const satisfies PolicyInquiryDraft;

const result = {
  overallStatus: 'action_required',
  statusLabel: '시술 전 확인 필요',
  summary: '시술 시작 전 필요한 행정 확인이 있어요.',
  conditionChecks: [
    {
      item: '지원결정통지서',
      status: 'action_required',
      note: '통지서 확인 필요',
    },
  ],
  supportItems: [],
  checklistGroups: [],
  inquiryQuestions: ['시술 전에 지원결정통지서 발급이 가능한가요?'],
  inquiryDraft: deterministicDraft,
  disclaimer: 'Fevio는 지원 대상 여부를 확정하지 않아요.',
  sources: [],
} as const satisfies PolicySupportResult;

const evidence = [
  {
    id: 'evidence-1',
    topic: '지원결정통지서',
    text: '시술 전 통지서 확인이 필요하다.',
    sourceLabel: '강남구보건소',
    sourceUrl: 'https://example.kr',
    lastVerifiedAt: '2026-06-03',
    confidence: 0.8,
  },
] as const satisfies readonly PolicyEvidence[];

describe('policy inquiry polish guard', () => {
  it('keeps deterministic draft when no API key is configured', async () => {
    const polished = await polishPolicyInquiryDraft({
      draft: deterministicDraft,
      result,
      evidence,
    });

    expect(polished).toEqual({
      draft: deterministicDraft,
      source: 'deterministic',
      rejected: false,
    });
  });

  it('accepts a safe polished draft from the LLM seam', async () => {
    const safeDraft = {
      recipient: deterministicDraft.recipient,
      subject: '난임부부 시술비 지원 신청 가능 여부 확인 요청',
      bodyLines: [
        '안녕하세요.',
        '서울특별시 강남구 거주자로 난임부부 시술비 지원 신청 전 확인을 요청드립니다.',
        '시술 전 지원결정통지서 발급 가능 여부와 필요 서류를 확인하고 싶습니다.',
        '최종 지원 여부와 금액은 보건소 확인으로 안내 부탁드립니다.',
      ],
    };

    const polished = await polishPolicyInquiryDraft(
      { draft: deterministicDraft, result, evidence },
      {
        apiKey: 'test-key',
        fetchPolishedDraft: async () => safeDraft,
      },
    );

    expect(polished).toEqual({
      draft: safeDraft,
      source: 'llm',
      rejected: false,
    });
  });

  it('rejects final eligibility claims and falls back to deterministic draft', async () => {
    const polished = await polishPolicyInquiryDraft(
      { draft: deterministicDraft, result, evidence },
      {
        apiKey: 'test-key',
        fetchPolishedDraft: async () => ({
          recipient: deterministicDraft.recipient,
          subject: '지원 대상입니다',
          bodyLines: ['100% 받을 수 있습니다. 보건소에 확인하지 않아도 됩니다.'],
        }),
      },
    );

    expect(polished).toEqual({
      draft: deterministicDraft,
      source: 'rejected_fallback',
      rejected: true,
    });
  });

  it('marks sensitive inquiry drafts unsafe', () => {
    expect(
      isPolicyInquiryDraftSafe({
        recipient: deterministicDraft.recipient,
        subject: '문의',
        bodyLines: ['병원명과 주민등록번호를 포함합니다.'],
      }),
    ).toBe(false);
  });
});
