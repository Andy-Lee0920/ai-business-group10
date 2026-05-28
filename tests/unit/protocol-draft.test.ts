import { describe, expect, it } from 'vitest';
import { createProtocolDraft } from '../../src/domain/protocol-draft';

describe('protocol draft', () => {
  const base = new Date('2026-05-11T00:00:00.000Z');

  it('turns hospital instructions into unconfirmed schedule and medication draft items', () => {
    const rawInstruction = '오늘 밤 10시 오비드렐 주사\n내일 오전 9시 병원 채혈\n프로기노바 1정 복용';
    const draft = createProtocolDraft(rawInstruction, base);

    expect(draft).toHaveLength(3);
    expect(draft[0]).toMatchObject({ suggestedCardType: 'injection', confidence: 'high', scheduledAt: '2026-05-11T22:00:00.000Z' });
    expect(draft[1]).toMatchObject({ suggestedCardType: 'clinic_visit', scheduledAt: '2026-05-12T09:00:00.000Z', careDate: '2026-05-12' });
    expect(draft[2]).toMatchObject({ suggestedCardType: 'medication', confidence: 'needs_confirmation' });
    for (const item of draft) {
      expect(rawInstruction.slice(item.sourceOffsetStart ?? 0, item.sourceOffsetEnd ?? 0)).toBe(item.sourceText);
    }
  });

  it('flags ambiguous or missing details instead of turning them into active cards', () => {
    const draft = createProtocolDraft('주사 확인\n뭔가 챙기기', base);

    expect(draft[0]?.uncertaintyReason).toContain('시간이나 날짜');
    expect(draft[1]).toMatchObject({ suggestedCardType: 'general_action', confidence: 'needs_confirmation' });
  });
});
