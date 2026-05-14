import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MORE_MENU_ITEMS } from '../../src/features/more/more-menu';
import { partnerStateCopy } from '../../src/features/partner/partner-state';

const moreScreen = readFileSync('src/features/more/more-screen.tsx', 'utf8');
const morePage = readFileSync('app/(authed)/more/page.tsx', 'utf8');
const partnerView = readFileSync('src/features/partner/partner-view.tsx', 'utf8');

describe('More and partner read-only state contract', () => {
  it('keeps More to six SLC helper menu items plus invite, notification, logout', () => {
    expect(MORE_MENU_ITEMS).toHaveLength(6);
    expect(MORE_MENU_ITEMS.map((item) => item.label)).toEqual([
      '오늘 홈', '일정 직접 추가', '기록 보기', '병원 후 업데이트', '파트너 상태 보기', '개인정보 안내',
    ]);
    expect(moreScreen).toContain('알림 상태');
    expect(moreScreen).toContain('15분 전 표시');
    expect(moreScreen).toContain('로그아웃');
    expect(morePage).toContain("redirect('/partner')");
  });

  it('has explicit partner state copy and no edit CTA in partner projection', () => {
    expect(partnerStateCopy('not_linked').title).toBe('아직 연결된 치료자가 없어요');
    expect(partnerStateCopy('requested').title).toBe('승인 대기 중');
    expect(partnerStateCopy('linked_no_schedule').title).toBe('오늘은 확인만 하면 됩니다');
    expect(partnerStateCopy('linked_with_schedule').title).toBe('오늘 상황');
    expect(partnerView).toContain('읽기 전용');
    expect(partnerView).not.toMatch(/수정|추가|완료하기|삭제/);
  });
});
