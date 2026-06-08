import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MORE_MENU_ITEMS } from '../../src/features/more/more-menu';
import { MoreScreen } from '../../src/features/more/more-screen';
import { PartnerView } from '../../src/features/partner/partner-view';
import { partnerStateCopy } from '../../src/features/partner/partner-state';
import type { PartnerLink } from '../../src/types/slc.types';
import type { PartnerActionViewItem } from '../../src/types/partner-view.types';

const moreScreen = readFileSync('src/features/more/more-screen.tsx', 'utf8');
const morePage = readFileSync('app/(authed)/more/page.tsx', 'utf8');
const settingsPage = readFileSync('app/(authed)/settings/page.tsx', 'utf8');
const partnerView = readFileSync('src/features/partner/partner-view.tsx', 'utf8');
const partnerPage = readFileSync('app/(authed)/partner/page.tsx', 'utf8');
const partnerTokenPage = readFileSync('app/partner/[token]/page.tsx', 'utf8');

describe('More and partner read-only state contract', () => {
  it('keeps More to six SLC helper menu items plus invite, notification, logout', () => {
    expect(MORE_MENU_ITEMS).toHaveLength(6);
    expect(MORE_MENU_ITEMS.map((item) => item.label)).toEqual([
      '일정 추가', '병원 후 업데이트', '지역 지원금 확인', '파트너 초대', '알림 설정', '개인정보 및 의료정보 안내',
    ]);
    expect(MORE_MENU_ITEMS.map((item) => item.label)).not.toContain('오늘 홈');
    expect(MORE_MENU_ITEMS.map((item) => item.label)).not.toContain('기록 보기');
    expect(moreScreen).toContain('알림 상태');
    expect(moreScreen).toContain('15분 전 표시');
    expect(moreScreen).toContain('로그아웃');
    expect(moreScreen).toContain('모든 정보 지우기');
    expect(moreScreen).toContain('/api/account/reset');
    expect(moreScreen).toContain("credentials: 'include'");
    expect(moreScreen).toContain('getResetAuthorizationHeader');
    expect(moreScreen).toContain('온보딩 다시');
    expect(moreScreen).toContain('승인하기');
    expect(moreScreen).toContain('나중에');
    expect(moreScreen).toContain('공유와 설정 관리');
    expect(moreScreen).toContain('data-testid="account-status-card"');
    expect(moreScreen).toContain('로그인 이메일');
    expect(moreScreen).toContain('provider');
    expect(moreScreen).toContain('파트너 연결');
    expect(moreScreen).toContain('공유 기록');
    expect(moreScreen).not.toContain('커플저널');
    expect(moreScreen).toContain('/settings/community-nickname');
    expect(moreScreen).not.toContain('>더보기<');
    expect(morePage).toContain("permanentRedirect('/settings')");
    expect(settingsPage).toContain("redirect('/partner')");
    expect(settingsPage).toContain('buildPresentationPartnerLinks()');
    expect(moreScreen).toContain('href="/settings/privacy"');
    expect(MORE_MENU_ITEMS.map((item) => item.href)).toContain('/settings/privacy');
    expect(MORE_MENU_ITEMS.map((item) => item.href)).toContain('/policy-support');
    expect(MORE_MENU_ITEMS.map((item) => item.href)).not.toContain('/privacy');
  });

  it('uses ambient PNG treatment for More while partner views keep required SLC illustrations', () => {
    const directImageTag = ['<', 'img'].join('');
    expect(`${moreScreen}
${partnerView}
${partnerPage}
${partnerTokenPage}`).not.toContain(directImageTag);

    expect(moreScreen).toContain('AmbientStoryBackground');
    expect(moreScreen).toContain('slcAssets.partner.syncOverview');
    expect(moreScreen).not.toContain('SLCIllustration');
    expect(moreScreen).not.toContain('slcAssets.partner.invite');
    expect(moreScreen).not.toContain('slcAssets.partner.connectedSuccess');
    expect(moreScreen).toContain('href="/home"');
    expect(moreScreen).toContain('>확인</a>');

    expect(partnerView).toContain('SLCIllustration');
    expect(partnerView).toContain('slcAssets.partner.readonly');

    expect(partnerPage).toContain('SLCIllustration');
    expect(partnerPage).toContain('slcAssets.partner.connectedSuccess');

    expect(partnerTokenPage).toContain('SLCIllustration');
    expect(partnerTokenPage).toContain('slcAssets.partner.readonly');
    expect(partnerTokenPage).toContain('오늘 일정만 확인할 수 있어요');
  });

  it('has explicit partner state copy and no edit CTA in partner projection', () => {
    expect(partnerStateCopy('not_linked').title).toBe('아직 연결된 치료자가 없어요');
    expect(partnerStateCopy('requested').title).toBe('승인 대기 중');
    expect(partnerStateCopy('linked_no_schedule').title).toBe('오늘은 확인만 하면 됩니다');
    expect(partnerStateCopy('linked_with_schedule').title).toBe('오늘 상황');
    expect(partnerView).toContain('읽기 전용');
    expect(partnerView).not.toMatch(/수정|추가|완료하기|삭제/);
  });

  it('shows only one partner sharing state when approved and requested links coexist', () => {
    const approvedLink: PartnerLink = {
      id: 'approved-link',
      patient_id: 'patient-1',
      partner_id: 'partner-1',
      invite_code: 'APPROVED-CODE',
      status: 'approved',
      approved_at: '2026-05-26T10:00:00.000Z',
      partner_profile: { display_name: '파트너' },
    };
    const requestedLink: PartnerLink = {
      id: 'requested-link',
      patient_id: 'patient-1',
      partner_id: 'partner-2',
      invite_code: 'REQUESTED-CODE',
      status: 'requested',
      requested_at: '2026-05-26T10:05:00.000Z',
      partner_profile: { display_name: '배우자' },
    };

    const markup = renderToStaticMarkup(React.createElement(MoreScreen, {
      userId: 'patient-1',
      existingLink: approvedLink,
      pendingRequests: [requestedLink],
      email: 'demo@fevio.app',
      provider: 'presentation',
      nickname: '페비오메이트',
      privacyGateAccepted: true,
      closedBetaStatus: 'closed beta',
    }));

    expect(markup).toContain('연결된 파트너');
    expect(markup).toContain('연결 해제');
    expect(markup).not.toContain('파트너 연결 요청이 있어요');
    expect(markup).not.toContain('초대 코드 · 읽기 전용 연결');
    expect(markup).not.toContain('APPROVED-CODE');
    expect(markup).not.toContain('REQUESTED-CODE');
  });

  it('renders partner canonical card status as read-only behavior-safe sentence copy', () => {
    const items: PartnerActionViewItem[] = [
      {
        safe_id: 'done-safe',
        title: '메노푸어 원문 제목은 렌더하지 않음',
        scheduled_at: '2026-05-14T06:30:00.000Z',
        card_type: 'injection',
        description: '150 IU 같은 용량 상세는 렌더하지 않음',
        display_state: 'completed',
        sync_revision: 2,
        partner_role: '확인자',
        partner_action: '완료된 항목이에요. 확인자 역할은 다음 확인까지 조용히 유지해 주세요.',
        avoid_prompt: '재촉하지 않기',
        visibility: 'partner_safe',
      },
      {
        safe_id: 'next-safe',
        title: '병원 방문 원문 제목은 렌더하지 않음',
        scheduled_at: '2026-05-14T11:00:00.000Z',
        card_type: 'clinic_visit',
        description: '원문 메모는 렌더하지 않음',
        display_state: 'current',
        sync_revision: 1,
        partner_role: '동행자',
        partner_action: '이동 시간, 준비물, 상담 후 다음 일정을 함께 확인해 주세요.',
        avoid_prompt: '의료 판단을 덧붙이지 않기',
        visibility: 'partner_safe',
      },
    ];
    const markup = renderToStaticMarkup(React.createElement(PartnerView, {
      items,
      hasRecentClinicUpdate: true,
    }));

    expect(markup).toContain('파트너가 읽기 전용으로 일정을 확인하는 일러스트');
    expect(markup).toContain('주사 일정 확인됐어요');
    expect(markup).toContain('다음은');
    expect(markup).toContain('병원 일정 예정이에요');
    expect(markup).toContain('확인자 역할은 다음 확인까지 조용히 유지해 주세요');
    expect(markup).toContain('이동 시간, 준비물, 상담 후 다음 일정을 함께 확인해 주세요');
    expect(markup).not.toContain('메노푸어 원문 제목');
    expect(markup).not.toContain('150 IU');
    expect(markup).not.toContain('원문 메모');
    expect(markup).toContain('오늘 병원 방문 후 일정이 변경됐어요');
    expect(markup).toContain('읽기 전용');
    expect(markup).not.toMatch(/수정|추가|완료하기|삭제/);
  });

  it('reads canonical partner-visible care cards for the authed partner page', () => {
    expect(partnerPage).toContain("from('care_action_cards')");
    expect(partnerPage).toContain("eq('created_by', link.patient_id)");
    expect(partnerPage).toContain("eq('partner_visible', true)");
    expect(partnerPage).toContain('serializePartnerViewCards');
    expect(partnerPage).not.toContain("from('schedule_items')");
    expect(partnerPage).not.toContain('completion_records');
    expect(partnerPage).not.toContain('source_text');
    expect(partnerPage).not.toContain("select('*')");
  });
});
