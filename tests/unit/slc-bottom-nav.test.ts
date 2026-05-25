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
    expect(source).toContain('무엇을 남길까요?');
    expect(source).toContain('주사·복약 남기기');
    expect(source).toContain('병원 방문 남기기');
    expect(source).toContain('href="/add"');
    expect(source).toContain('href="/clinic-update"');
    expect(source).toContain("background: 'rgba(255, 252, 247, 0.96)'");
    expect(source).toContain("borderTopLeftRadius: 28");
  });


  it('makes the center plus a brand-colored icon-only action', () => {
    const actionBlock = source.slice(source.indexOf("if (item.kind === 'action')"), source.indexOf('const active = pathname'));

    expect(actionBlock).toContain('aria-label="추가 메뉴 열기"');
    expect(actionBlock).toContain('iconShellStyle(false, center)');
    expect(actionBlock).not.toContain('labelStyle');
    expect(source).toContain("background: 'linear-gradient(180deg, #E96857 0%, #D25B4C 100%)'");
    expect(source).toContain("color: '#fff'");
    expect(source).toContain('0 12px 24px rgba(216, 98, 77, 0.28)');
  });

  it('uses aligned lucide icons for the bottom tab set', () => {
    expect(source).toContain("import { CalendarDays, FileText, Hospital, House, Plus, Settings, Syringe } from 'lucide-react'");
    expect(source).toContain('<House aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />');
    expect(source).toContain('<Settings aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />');
    expect(source).not.toContain('<circle cx="12" cy="12" r="4.35" />');
  });
});
