import { describe, expect, it } from 'vitest';
import { buildTwoWeekWaitAnchor, isForbiddenTwoWeekWaitCopy } from '../../src/domain/two-week-wait';
import { careDayForConfirmedPhase } from '../../src/domain/cycle-state-machine';

describe('TwoWeekWait surface anchor', () => {
  it('turns embryo transfer and beta dates into a D+n time anchor', () => {
    const anchor = buildTwoWeekWaitAnchor({
      transferDate: '2026-05-19',
      betaDate: '2026-05-29',
      today: '2026-05-22',
    });

    expect(anchor).toMatchObject({
      dayPostTransfer: 3,
      daysUntilBeta: 7,
      title: '이식 후 D+3 · 피검까지 7일',
      tone: 'settling',
      primaryAction: '오늘은 기록만 남기기',
    });
    expect(anchor.explanation).toContain('루틴을 유지');
    expect(anchor.judgementBoundary).toContain('오늘 판단하지 않아도');
  });

  it('uses restrained copy ranges and rejects pregnancy-test interpretation language', () => {
    const early = buildTwoWeekWaitAnchor({ transferDate: '2026-05-19', betaDate: '2026-05-30', today: '2026-05-20' });
    const middle = buildTwoWeekWaitAnchor({ transferDate: '2026-05-19', betaDate: '2026-05-30', today: '2026-05-24' });
    const late = buildTwoWeekWaitAnchor({ transferDate: '2026-05-19', betaDate: '2026-05-30', today: '2026-05-28' });

    expect(early.explanation).toContain('몸을 설득하려 애쓰지 않아도');
    expect(middle.explanation).toContain('증상으로 결론을 내리지 않는');
    expect(late.explanation).toContain('결과는 병원에서 확인');

    for (const anchor of [early, middle, late]) {
      const body = JSON.stringify(anchor);
      expect(isForbiddenTwoWeekWaitCopy(body)).toBe(false);
      expect(body).not.toMatch(/임테기|착상 성공|실패|다음 cycle|증상 검색/u);
    }
  });

  it('maps confirmed two_week_wait phase to the dedicated care day', () => {
    expect(careDayForConfirmedPhase('two_week_wait')).toBe('two_week_wait_day');
  });
});
