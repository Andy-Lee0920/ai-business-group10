import { describe, expect, it } from 'vitest';
import { normalizeJournalDraftForAuthor } from '../../src/domain/couple-journal';
import { runDeterministicModerationFilter } from '../../src/domain/community-moderation';
import { toggleCommunityEmpathy } from '../../src/domain/community-empathy';
import type { CoupleJournalEntryDraft } from '../../src/types/journal.types';

const baseJournalDraft: CoupleJournalEntryDraft = {
  body: '오늘은 주사를 맞고 쉬었어요.',
  mood: 'tired',
  painScore: 6,
  photoUrls: [],
  authorRole: 'primary',
};

describe('records/community domain safeguards', () => {
  it('forces partner-authored journal medical fields to null', () => {
    const draft = normalizeJournalDraftForAuthor({ ...baseJournalDraft, authorRole: 'partner' });

    expect(draft.painScore).toBeNull();
  });

  it('keeps primary-authored journal pain score intact', () => {
    const draft = normalizeJournalDraftForAuthor(baseJournalDraft);

    expect(draft.painScore).toBe(6);
  });

  it('moderates deterministic keyword and regex matches', () => {
    const result = runDeterministicModerationFilter('병원 가지 말고 용량 늘려도 돼요', [
      { ruleType: 'keyword', pattern: '용량 늘려', severity: 'high', active: true },
      { ruleType: 'regex', pattern: '병원\\s*가지\\s*말', severity: 'high', active: true },
    ]);

    expect(result).toEqual({ status: 'pending', matchedPatterns: ['용량 늘려', '병원\\s*가지\\s*말'] });
  });

  it('does not flag inactive rules or safe medication schedule mentions', () => {
    const result = runDeterministicModerationFilter('오늘 오비드렐 시간을 확인했어요', [
      { ruleType: 'keyword', pattern: '용량 늘려', severity: 'high', active: true },
      { ruleType: 'keyword', pattern: '오비드렐', severity: 'low', active: false },
    ]);

    expect(result).toEqual({ status: 'approved', matchedPatterns: [] });
  });

  it('toggles empathy with a non-negative derived count', () => {
    expect(toggleCommunityEmpathy({ active: false, count: 2 })).toEqual({ active: true, count: 3 });
    expect(toggleCommunityEmpathy({ active: true, count: 2 })).toEqual({ active: false, count: 1 });
    expect(toggleCommunityEmpathy({ active: true, count: 0 })).toEqual({ active: false, count: 0 });
  });
});
