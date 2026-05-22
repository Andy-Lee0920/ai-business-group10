import { describe, expect, it } from 'vitest';
import { generateDailyBrief } from '../../src/lib/brief/generateBrief';
import { factDict } from '../../src/lib/brief/factDict';

const input = {
  confirmedPhase: 'consultation',
  phaseCareDay: 'routine_day',
  dayIndexInPhase: 0,
  facts: factDict.consultation,
  recentCriticalEventTypes: [],
} as const;

describe('generateDailyBrief fallback', () => {
  it('renders raw factDict text when the LLM fails', async () => {
    const result = await generateDailyBrief(input, {
      fetchBrief: async () => { throw new Error('llm_down'); },
      apiKey: 'test-key',
    });

    expect(result.source).toBe('fallback');
    expect(result.line).toContain(factDict.consultation[0].fact);
    expect(result.line.trim().length).toBeGreaterThan(0);
  });

  it('rejects medical inference and falls back to facts', async () => {
    const result = await generateDailyBrief(input, {
      fetchBrief: async () => '임신 성공을 예측할 수 있어요.',
      apiKey: 'test-key',
    });

    expect(result.source).toBe('rejected_fallback');
    expect(result.line).toContain(factDict.consultation[0].fact);
  });
});
