import { describe, expect, it } from 'vitest';
import { getPresentationScenarioCards, normalizePresentationCare, toAdaptiveCareDay } from '../../src/features/adaptive-home/presentation-scenarios';

describe('Vercel-visible home demo care params', () => {
  it('accepts 2WW and result protection care params for visible demo links', () => {
    expect(normalizePresentationCare('two_week_wait_day')).toBe('two_week_wait_day');
    expect(normalizePresentationCare('result_protection_day')).toBe('result_protection_day');
    expect(toAdaptiveCareDay('two_week_wait_day')).toBe('two_week_wait_day');
    expect(toAdaptiveCareDay('result_protection_day')).toBe('result_protection_day');
  });

  it('uses utility cards without result interpretation for 2WW and result protection', () => {
    const now = new Date('2026-05-12T10:00:00+09:00');
    const twoWeekWait = getPresentationScenarioCards('two_week_wait_day', now).map((card) => card.title).join(' / ');
    const resultProtection = getPresentationScenarioCards('result_protection_day', now).map((card) => card.title).join(' / ');

    expect(twoWeekWait).toContain('D+');
    expect(resultProtection).toContain('결과 공유 범위');
    expect(`${twoWeekWait} ${resultProtection}`).not.toMatch(/성공|실패|정상|위험/u);
  });
});
