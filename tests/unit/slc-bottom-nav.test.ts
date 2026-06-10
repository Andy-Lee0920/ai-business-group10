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
        kind: 'link',
        href: '/care-agent',
        label: '+',
        icon: 'plus',
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

  it('routes the center plus to the Care Agent entrypoint', () => {
    expect(source).toContain('bottom-nav-create-button');
    expect(source).toContain('href: \'/care-agent\'');
    expect(source).toContain('aria-label={center ? \'케어 에이전트 열기\' : undefined}');
    expect(source).not.toContain('data-testid="create-bottom-sheet"');
    expect(source).not.toContain('무엇을 남길까요?');
  });


  it('makes the center plus a brand-colored icon-only action', () => {
    const actionBlock = source.slice(source.indexOf('<Link'), source.indexOf('</Link>'));

    expect(actionBlock).toContain('케어 에이전트 열기');
    expect(actionBlock).toContain('iconShellStyle(active, center)');
    expect(source).toContain('{center ? null : <span style={labelStyle}>{item.label}</span>}');
    expect(source).toContain("background: 'linear-gradient(180deg, #E96857 0%, #D25B4C 100%)'");
    expect(source).toContain("color: '#fff'");
    expect(source).toContain('0 12px 24px rgba(216, 98, 77, 0.28)');
  });

  it('uses aligned lucide icons for the bottom tab set', () => {
    expect(source).toContain("import { CalendarDays, FileText, House, Plus, Settings } from 'lucide-react'");
    expect(source).toContain('<House aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />');
    expect(source).toContain('<Settings aria-hidden="true" focusable="false" size={20} strokeWidth={1.85} />');
    expect(source).not.toContain('<circle cx="12" cy="12" r="4.35" />');
  });
});
