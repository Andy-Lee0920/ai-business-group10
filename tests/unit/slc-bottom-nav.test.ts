import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../../src/components/bottom-nav';

describe('SLC bottom navigation', () => {
  it('uses the single-label records, home, and management tabs', () => {
    expect(NAV_ITEMS).toEqual([
      expect.objectContaining({
        href: '/records',
        label: '기록',
        icon: 'timeline',
      }),
      expect.objectContaining({
        href: '/home',
        label: '홈',
        icon: 'care',
        placement: 'center',
      }),
      expect.objectContaining({
        href: '/more',
        label: '관리',
        icon: 'manage',
      }),
    ]);
    expect(NAV_ITEMS).toEqual(expect.not.arrayContaining([
      expect.objectContaining({ caption: expect.any(String) }),
    ]));
  });
});
