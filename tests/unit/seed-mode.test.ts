import { describe, expect, it } from 'vitest';
import { getPresentationSeedItems, getProductionSeedItems } from '../../src/lib/seed-helpers';

describe('SLC seed timing', () => {
  it('creates presentation Menopur at now plus 10 minutes', () => {
    const base = new Date('2026-05-14T03:00:00.000Z');
    const [menopur, cetrotide] = getPresentationSeedItems('user-1', base);
    expect(menopur.title).toBe('Menopur 150 IU');
    expect(new Date(menopur.scheduled_at).getTime() - base.getTime()).toBe(10 * 60_000);
    expect(new Date(cetrotide.scheduled_at).getTime() - base.getTime()).toBe(45 * 60_000);
  });

  it('creates production Menopur at the next 06:30 Asia/Seoul boundary', () => {
    const [menopur] = getProductionSeedItems('user-1', new Date('2026-05-14T03:00:00.000Z'));
    const kstMinutes = (new Date(menopur.scheduled_at).getUTCHours() * 60 + new Date(menopur.scheduled_at).getUTCMinutes() + 9 * 60) % (24 * 60);
    expect(kstMinutes).toBe(6 * 60 + 30);
  });
});
