import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecordsScreen } from '../../src/features/records/records-screen';

const route = 'app/api/community/posts/[postId]/comments/route.ts';

describe('community comments contract', () => {
  it('supports moderated nested comments for approved audience posts', () => {
    expect(existsSync(route)).toBe(true);
    const source = readFileSync(route, 'utf8');
    expect(source).toContain("from('community_comments')");
    expect(source).toContain('parent_comment_id');
    expect(source).toContain("moderation_status: 'pending'");
    expect(source).toContain("eq('moderation_status', 'approved')");
  });

  it('renders comment affordance and pending comments in the records community list', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [],
      completions: [],
      clinicUpdates: [],
      journalEntries: [],
      communityPosts: [{
        id: 'post-1',
        body: '같이 확인한 팁이에요.',
        mood: null,
        subCategory: 'today',
        audience: 'primary_feed',
        moderationStatus: 'approved',
        isOfficial: false,
        createdAt: '2026-05-20T08:10:00.000Z',
        authorNickname: '오비드렐메이트',
        comments: [{
          id: 'comment-1',
          postId: 'post-1',
          parentCommentId: null,
          body: '저도 도움됐어요.',
          moderationStatus: 'pending',
          authorNickname: '페비오메이트',
          createdAt: '2026-05-20T08:20:00.000Z',
        }],
      }],
      communityAudience: 'primary_feed',
    }));

    expect(markup).toContain('댓글 남기기');
    expect(markup).toContain('저도 도움됐어요.');
    expect(markup).toContain('댓글 검수 중');
  });
});
