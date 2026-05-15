import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../../src/components/bottom-nav';

const source = readFileSync('src/components/bottom-nav.tsx', 'utf8');

describe('SLC bottom navigation', () => {
  it('uses the five-tab home, calendar, add, records, and settings order', () => {
    expect(NAV_ITEMS).toEqual([
      expect.objectContaining({
        kind: 'link',
        href: '/home',
        label: '홈',
        icon: 'care',
      }),
      expect.objectContaining({
        kind: 'link',
        href: '/calendar',
        label: '캘린더',
        icon: 'calendar',
      }),
      expect.objectContaining({
        kind: 'action',
        label: '+',
        icon: 'plus',
        action: 'open-create-sheet',
      }),
      expect.objectContaining({
        kind: 'link',
        href: '/records',
        label: '기록',
        icon: 'timeline',
      }),
      expect.objectContaining({
        kind: 'link',
        href: '/settings',
        label: '설정',
        icon: 'gear',
      }),
    ]);
    expect(NAV_ITEMS).toEqual(expect.not.arrayContaining([
      expect.objectContaining({ caption: expect.any(String) }),
    ]));
  });

  it('opens the plus action as a local bottom sheet instead of a navigation link', () => {
    expect(source).toContain('data-testid="bottom-nav-create-button"');
    expect(source).toContain('data-testid="create-bottom-sheet"');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('일정 추가');
    expect(source).toContain('병원 메모');
    expect(source).toContain('href="/add"');
    expect(source).toContain('href="/clinic-update"');
    expect(source).toContain("background: 'var(--slc-surface)'");
    expect(source).toContain("borderTopLeftRadius: 16");
  });
});
