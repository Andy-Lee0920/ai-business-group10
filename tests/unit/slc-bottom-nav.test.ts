import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../../src/components/bottom-nav';

describe('SLC bottom navigation', () => {
  it('separates the three patient jobs as today care, history flow, and sharing management', () => {
    expect(NAV_ITEMS).toEqual([
      expect.objectContaining({
        href: '/records',
        label: '기록',
        caption: '흐름',
        icon: 'timeline',
        ariaLabel: '케어 기록 흐름 보기',
      }),
      expect.objectContaining({
        href: '/home',
        label: '오늘',
        caption: '케어',
        icon: 'care',
        ariaLabel: '오늘 케어 보기',
        placement: 'center',
      }),
      expect.objectContaining({
        href: '/more',
        label: '관리',
        caption: '공유',
        icon: 'manage',
        ariaLabel: '공유와 설정 관리',
      }),
    ]);
  });
});
