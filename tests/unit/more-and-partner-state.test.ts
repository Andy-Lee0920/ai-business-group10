import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MORE_MENU_ITEMS } from '../../src/features/more/more-menu';
import { PartnerView } from '../../src/features/partner/partner-view';
import { partnerStateCopy } from '../../src/features/partner/partner-state';

const moreScreen = readFileSync('src/features/more/more-screen.tsx', 'utf8');
const morePage = readFileSync('app/(authed)/more/page.tsx', 'utf8');
const partnerView = readFileSync('src/features/partner/partner-view.tsx', 'utf8');

describe('More and partner read-only state contract', () => {
  it('keeps More to six SLC helper menu items plus invite, notification, logout', () => {
    expect(MORE_MENU_ITEMS).toHaveLength(5);
    expect(MORE_MENU_ITEMS.map((item) => item.label)).toEqual([
      '일정 추가', '병원 후 업데이트', '파트너 초대', '알림 설정', '개인정보 및 의료정보 안내',
    ]);
    expect(MORE_MENU_ITEMS.map((item) => item.label)).not.toContain('오늘 홈');
    expect(MORE_MENU_ITEMS.map((item) => item.label)).not.toContain('기록 보기');
    expect(moreScreen).toContain('알림 상태');
    expect(moreScreen).toContain('15분 전 표시');
    expect(moreScreen).toContain('로그아웃');
    expect(moreScreen).toContain('승인하기');
    expect(moreScreen).toContain('나중에');
    expect(moreScreen).toContain('공유와 설정 관리');
    expect(moreScreen).not.toContain('>더보기<');
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

  it('renders partner schedule status as read-only sentence copy', () => {
    const markup = renderToStaticMarkup(React.createElement(PartnerView, {
      items: [
        {
          id: 'done-1',
          patient_id: 'patient-1',
          medication_id: 'menopur',
          type: 'injection',
          title: '메노푸어',
          dose: null,
          unit: null,
          scheduled_at: '2026-05-14T06:30:00.000Z',
          status: 'completed',
          source: 'manual',
          created_at: '2026-05-14T00:00:00.000Z',
        },
        {
          id: 'next-1',
          patient_id: 'patient-1',
          medication_id: null,
          type: 'clinic',
          title: '병원 방문',
          dose: null,
          unit: null,
          scheduled_at: '2026-05-14T11:00:00.000Z',
          status: 'upcoming',
          source: 'manual',
          created_at: '2026-05-14T00:00:00.000Z',
        },
      ],
      completions: [{ id: 'complete-1', schedule_item_id: 'done-1', patient_id: 'patient-1', completed_at: '2026-05-14T06:35:00.000Z', injection_site: null }],
      latestClinicUpdate: {
        id: 'clinic-update-1',
        patient_id: 'patient-1',
        same_medication: true,
        added_medication_ids: [],
        medication_days: 2,
        next_visit_at: '2026-05-16T09:00:00.000Z',
        trigger_plan: null,
        memo: null,
        created_at: '2026-05-14T12:00:00.000Z',
      },
    }));

    expect(markup).toContain('메노푸어 주사 완료했어요');
    expect(markup).toContain('다음은');
    expect(markup).toContain('병원 방문 예정이에요');
    expect(markup).toContain('오늘 병원 방문 후 일정이 변경됐어요');
    expect(markup).toContain('읽기 전용');
    expect(markup).not.toMatch(/수정|추가|완료하기|삭제/);
  });
});
