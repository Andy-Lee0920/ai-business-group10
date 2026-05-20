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
      journalEntries: [{
        id: 'journal-1',
        body: '오늘은 주사 준비를 같이 확인했다.',
        mood: 'calm',
        painScore: 2,
        photoUrls: [],
        authorRole: 'primary',
        createdAt: '2026-05-20T08:00:00.000Z',
      }],
      communityPosts: [{
        id: 'post-1',
        body: '오비드렐 시간 확인 팁을 남겨요.',
        mood: null,
        subCategory: 'today',
        audience: 'primary_feed',
        moderationStatus: 'pending',
        isOfficial: false,
        createdAt: '2026-05-20T08:10:00.000Z',
        empathyCount: 2,
        empathyActive: false,
      }],
      communityAudience: 'primary_feed',
    }));

    expect(markup).toContain('data-testid="couple-journal-form"');
    expect(markup).toContain('오늘은 주사 준비를 같이 확인했다.');
    expect(markup).toContain('통증 점수');
    expect(markup).toContain('data-testid="community-post-form"');
    expect(markup).toContain('오비드렐 시간 확인 팁을 남겨요.');
    expect(markup).toContain('검수 중');
    expect(markup).toContain('primary_feed');
    expect(markup).toContain('공감 2');
  });
});
