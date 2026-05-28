import { describe, expect, it } from 'vitest';
import { pickHeroSurface } from '../../src/lib/brief/priority';

const NOW = new Date('2026-05-22T12:00:00.000+09:00');

function card(minutesFromNow: number, status: 'upcoming' | 'completed' | 'missed' = 'upcoming') {
  return {
    id: `card-${minutesFromNow}`,
    scheduled_at: new Date(NOW.getTime() + minutesFromNow * 60_000).toISOString(),
    status,
  };
}

describe('pickHeroSurface', () => {
  it('promotes execution for overdue confirmed cards', () => {
    expect(pickHeroSurface({ now: NOW, cards: [card(-1)] })).toMatchObject({
      heroSurface: 'execution',
      overrideReason: 'overdue',
    });
  });

  it('promotes execution at the 15 minute boundary', () => {
    expect(pickHeroSurface({ now: NOW, cards: [card(15)] })).toMatchObject({
      heroSurface: 'execution',
      overrideReason: 'within_15m',
      proximityMinutes: 15,
    });
  });

  it('promotes execution at the 60 minute boundary', () => {
    expect(pickHeroSurface({ now: NOW, cards: [card(60)] })).toMatchObject({
      heroSurface: 'execution',
      overrideReason: 'within_60m',
      proximityMinutes: 60,
    });
  });

  it('keeps daily brief as hero when no pending card is time critical', () => {
    expect(pickHeroSurface({ now: NOW, cards: [card(61), card(10, 'completed')] })).toMatchObject({
      heroSurface: 'brief',
      overrideReason: 'none',
    });
  });
});
