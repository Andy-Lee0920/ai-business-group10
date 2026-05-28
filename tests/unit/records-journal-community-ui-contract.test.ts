import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecordsScreen } from '../../src/features/records/records-screen';

describe('records journal/community UI contract', () => {
  it('renders actionable couple journal and moderated community surfaces', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      journalEntries: [],
      communityPosts: [{
        id: 'post-1',
        body: '오비드렐 시간 확인 팁을 남겨요.',
        mood: null,
        subCategory: 'today',
        audience: 'primary_feed',
        moderationStatus: 'pending',
        isOfficial: false,
        createdAt: '2026-05-20T08:10:00.000Z',
        authorNickname: '오비드렐메이트',
        photoUrls: ['/assets/slc/clinic-update-banner.png'],
        audienceScope: 'everyone',
        audienceRole: null,
        empathyCount: 2,
        empathyActive: false,
      }],
      communityAudience: 'primary_feed',
      isPartnerLinked: true,
    }));

    expect(markup).toContain('data-testid="records-subtab-journal"');
    expect(markup).toContain('data-testid="records-subtab-community"');
    expect(markup).toContain('data-testid="records-compose-button"');
    expect(markup).toContain('data-testid="couple-journal-form"');
    expect(markup).toContain('type="file"');
    expect(markup).toContain('둘만의 첫 기록을 남겨보세요');

    const communityMarkup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      journalEntries: [],
      communityPosts: [{
        id: 'post-1',
        body: '오비드렐 시간 확인 팁을 남겨요.',
        mood: null,
        subCategory: 'today',
        audience: 'primary_feed',
        moderationStatus: 'pending',
        isOfficial: false,
        createdAt: '2026-05-20T08:10:00.000Z',
        authorNickname: '오비드렐메이트',
        photoUrls: ['/assets/slc/clinic-update-banner.png'],
        audienceScope: 'everyone',
        audienceRole: null,
        empathyCount: 2,
        empathyActive: false,
      }],
      communityAudience: 'primary_feed',
      isPartnerLinked: true,
      initialTab: 'community',
    }));

    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('data-testid="community-post-form"');
    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('fevio-community-sheet-layer');
    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('type="file"');
    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('community-photo-strip');
    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('community-photo-upload-error');
    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('.remove(paths)');
    expect(readFileSync('src/features/records/community/community-preview.tsx', 'utf8')).toContain('aria-label="닫기"');
    expect(communityMarkup).toContain('사진으로 남기는 확인 기록');
    expect(communityMarkup).toContain('오비드렐 시간 확인 팁을 남겨요.');
    expect(communityMarkup).toContain('data-testid="community-photo-strip"');
    expect(communityMarkup).toContain('검수 중');
    expect(communityMarkup).toContain('전체 공개');
    expect(communityMarkup).toContain('오비드렐메이트');
    expect(communityMarkup).toContain('댓글 0');
  });

  it('does not expose internal seed artifacts or role jargon in the community feed', () => {
    const source = readFileSync('src/features/records/community/community-preview.tsx', 'utf8');
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      journalEntries: [],
      communityPosts: [{
        id: 'seed-post-1',
        body: 'same role post 1779273192113',
        mood: null,
        subCategory: 'tip',
        audience: 'primary_feed',
        moderationStatus: 'approved',
        isOfficial: false,
        createdAt: '2026-05-20T08:10:00.000Z',
        authorNickname: null,
        audienceScope: 'same_role',
        audienceRole: 'primary',
        empathyCount: 0,
        empathyActive: false,
      }, {
        id: 'smoke-post-1',
        body: 'prod approved community smoke eb2bf360',
        mood: null,
        subCategory: 'today',
        audience: 'primary_feed',
        moderationStatus: 'approved',
        isOfficial: false,
        createdAt: '2026-05-20T08:11:00.000Z',
        authorNickname: null,
        audienceScope: 'everyone',
        audienceRole: null,
        empathyCount: 0,
        empathyActive: false,
      }],
      communityAudience: 'primary_feed',
      isPartnerLinked: true,
      initialTab: 'community',
    }));

    expect(markup).not.toContain('same role post');
    expect(markup).not.toContain('prod approved community smoke');
    expect(markup).not.toContain('같은 롤');
    expect(markup).toContain('아직 사진 기록이 없어요');
    expect(source).toContain('비슷한 단계 사용자');
    expect(source).not.toContain('같은 롤만');
  });

  it('keeps the community tab free of partner-link journal guidance when unlinked', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      journalEntries: [],
      communityPosts: [],
      communityAudience: 'primary_feed',
      isPartnerLinked: false,
      initialTab: 'community',
    }));

    expect(markup).toContain('data-testid="community-preview"');
    expect(markup).not.toContain('data-testid="couple-journal-locked"');
    expect(markup).not.toContain('파트너 초대하기');
    expect(markup).not.toContain('/more#partner-invite');
  });

  it('locks only the couple journal tab until a partner link is approved', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      journalEntries: [],
      communityPosts: [],
      communityAudience: 'primary_feed',
      isPartnerLinked: false,
      initialTab: 'journal',
    }));

    expect(markup).toContain('data-testid="couple-journal-locked"');
    expect(markup).toContain('파트너 초대하기');
    expect(markup).toContain('/more#partner-invite');
    expect(markup).not.toContain('data-testid="community-preview"');
  });
});
