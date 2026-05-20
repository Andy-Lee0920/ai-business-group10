'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { CommunityAudience, CommunityAudienceScope, CommunityCommentListItem, CommunityPostListItem, CommunitySubCategory } from '../../../types/community.types';

const COMMUNITY_FILTERS: { value: CommunitySubCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pain', label: '통증' },
  { value: 'worry', label: '걱정' },
  { value: 'today', label: '오늘' },
  { value: 'tip', label: '팁' },
];

const COMMUNITY_CATEGORIES: { value: CommunitySubCategory; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'pain', label: '통증' },
  { value: 'worry', label: '걱정' },
  { value: 'tip', label: '팁' },
];

interface CommunityPreviewProps {
  posts: CommunityPostListItem[];
  audience: CommunityAudience;
}

export function CommunityPreview({ posts, audience }: CommunityPreviewProps) {
  const [communityPosts, setCommunityPosts] = useState(posts);
  const [selectedCategory, setSelectedCategory] = useState<CommunitySubCategory | 'all'>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const visiblePosts = useMemo(() => {
    const sorted = [...communityPosts].sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (selectedCategory === 'all') return sorted;
    return sorted.filter((post) => post.subCategory === selectedCategory);
  }, [communityPosts, selectedCategory]);

  async function toggleEmpathy(post: CommunityPostListItem) {
    const currentCount = post.empathyCount ?? 0;
    const nextActive = !post.empathyActive;
    setCommunityPosts((current) => current.map((candidate) => (candidate.id === post.id
      ? { ...candidate, empathyActive: nextActive, empathyCount: Math.max(0, currentCount + (nextActive ? 1 : -1)) }
      : candidate)));
    try {
      const response = await fetch(`/api/community/posts/${encodeURIComponent(post.id)}/empathy`, { method: 'POST', cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as { active?: boolean; count?: number };
      if (!response.ok || typeof payload.active !== 'boolean' || typeof payload.count !== 'number') throw new Error('empathy_failed');
      setCommunityPosts((current) => current.map((candidate) => (candidate.id === post.id
        ? { ...candidate, empathyActive: payload.active, empathyCount: payload.count }
        : candidate)));
    } catch {
      setCommunityPosts((current) => current.map((candidate) => (candidate.id === post.id
        ? { ...candidate, empathyActive: post.empathyActive, empathyCount: currentCount }
        : candidate)));
    }
  }

  async function submitComment(post: CommunityPostListItem, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;
    const response = await fetch(`/api/community/posts/${encodeURIComponent(post.id)}/comments`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body, parentCommentId: null }),
    });
    const payload = await response.json().catch(() => ({})) as { comment?: Record<string, unknown> };
    const comment = payload.comment;
    if (response.ok && comment) {
      setCommunityPosts((current) => current.map((candidate) => (candidate.id === post.id
        ? { ...candidate, comments: [...(candidate.comments ?? []), normalizeComment(comment)] }
        : candidate)));
      form.reset();
    }
  }

  async function submitCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    const subCategory = normalizeCategory(formData.get('subCategory')) ?? 'today';
    const audienceScope = normalizeAudienceScope(formData.get('audienceScope')) ?? 'everyone';
    if (!body) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body, mood: null, subCategory, audienceScope }),
      });
      const payload = await response.json().catch(() => ({})) as { post?: Record<string, unknown> };
      const post = payload.post;
      if (response.ok && post) {
        setCommunityPosts((current) => [normalizePost(post, subCategory, audience), ...current]);
        form.reset();
        setIsComposerOpen(false);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section data-testid="community-preview" aria-label="커뮤니티" style={communityShellStyle}>
      <header style={communityHeaderStyle}>
        <div>
          <span style={sectionEyebrowStyle}>커뮤니티</span>
          <h2 style={sectionTitleStyle}>같은 과정을 지나가는 사람들의 이야기</h2>
        </div>
        <button type="button" data-testid="records-compose-button" onClick={() => setIsComposerOpen(true)} style={composeButtonStyle}>＋</button>
      </header>

      <button type="button" onClick={() => setIsComposerOpen(true)} style={slimComposeStyle}>같은 입장의 사람들에게 한 마디 남기기</button>

      <div aria-label="커뮤니티 필터" style={filterRowStyle}>
        {COMMUNITY_FILTERS.map((chip) => (
          <button key={chip.value} type="button" onClick={() => setSelectedCategory(chip.value)} style={chip.value === selectedCategory ? activeFilterStyle : filterStyle}>{chip.label}</button>
        ))}
      </div>

      {isComposerOpen ? (
        <div role="dialog" aria-label="커뮤니티 글쓰기" style={sheetBackdropStyle}>
          <form data-testid="community-post-form" onSubmit={submitCommunityPost} style={sheetStyle}>
            <div style={sheetHandleStyle} />
            <h3 style={sheetTitleStyle}>커뮤니티에 남기기</h3>
            <textarea name="body" required placeholder="오늘 헷갈렸던 것, 확인한 팁, 그냥 남기고 싶은 말을 적어주세요." style={textareaStyle} />
            <div style={sheetGridStyle}>
              <label style={labelStyle}>보기 범위
                <select name="audienceScope" defaultValue="everyone" style={inputStyle}>
                  <option value="everyone">모두에게</option>
                  <option value="same_role">같은 롤만</option>
                </select>
              </label>
              <label style={labelStyle}>주제
                <select name="subCategory" defaultValue="today" style={inputStyle}>
                  {COMMUNITY_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
            </div>
            <p style={helperStyle}>같은 롤만 = 같은 입장 사용자에게만 보입니다. 검수 중인 글은 본인에게만 표시돼요.</p>
            <button type="submit" disabled={isSaving} style={buttonStyle}>{isSaving ? '등록 중' : '올리기'}</button>
            <button type="button" onClick={() => setIsComposerOpen(false)} style={cancelButtonStyle}>취소</button>
          </form>
        </div>
      ) : null}

      <div style={feedStyle}>
        {visiblePosts.length === 0 ? (
          <p style={emptyStyle}>아직 이 주제의 글이 없어요.</p>
        ) : visiblePosts.map((post) => (
          <article key={post.id} style={postStyle}>
            <div style={postMetaStyle}>
              <span>{post.authorNickname ?? '페비오 메이트'}</span>
              <span>·</span>
              <span>{formatDate(post.createdAt)}</span>
              <span style={scopeBadgeStyle}>{scopeLabel(post.audienceScope)}</span>
              {post.isOfficial ? <span style={officialBadgeStyle}>운영팀 안내</span> : null}
              {post.moderationStatus === 'pending' ? <span style={pendingStyle}>검수 중</span> : null}
            </div>
            <p style={postBodyStyle}>{post.body}</p>
            <div style={postActionRowStyle}>
              <button type="button" onClick={() => toggleEmpathy(post)} style={post.empathyActive ? activeEmpathyButtonStyle : empathyButtonStyle}>공감 {post.empathyCount ?? 0}</button>
              <span style={categoryStyle}>#{labelFor(post.subCategory)}</span>
            </div>
            <div style={commentListStyle}>
              {(post.comments ?? []).map((comment) => (
                <div key={comment.id} style={commentStyle}>
                  <span style={commentMetaStyle}>{comment.authorNickname ?? '커뮤니티'} · {comment.moderationStatus === 'pending' ? '댓글 검수 중' : '댓글'}</span>
                  <p style={commentBodyStyle}>{comment.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={(event) => submitComment(post, event)} style={commentFormStyle}>
              <input name="body" required placeholder="댓글을 남겨주세요." style={commentInputStyle} />
              <button type="submit" style={commentButtonStyle}>댓글 남기기</button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}

function normalizePost(row: Record<string, unknown>, fallbackCategory: CommunitySubCategory, fallbackAudience: CommunityAudience): CommunityPostListItem {
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood : null,
    subCategory: normalizeCategory(row.sub_category) ?? fallbackCategory,
    audience: row.audience === 'partner_feed' ? 'partner_feed' : fallbackAudience,
    audienceScope: normalizeAudienceScope(row.audience_scope) ?? 'everyone',
    audienceRole: row.audience_role === 'primary' || row.audience_role === 'partner' ? row.audience_role : null,
    moderationStatus: row.moderation_status === 'approved' || row.moderation_status === 'rejected' ? row.moderation_status : 'pending',
    isOfficial: row.is_official === true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    authorNickname: typeof row.author_nickname === 'string' ? row.author_nickname : null,
    empathyCount: typeof row.empathy_count === 'number' ? row.empathy_count : 0,
    empathyActive: row.empathy_active === true,
  };
}

function normalizeComment(row: Record<string, unknown>): CommunityCommentListItem {
  return {
    id: String(row.id),
    postId: String(row.post_id ?? ''),
    parentCommentId: typeof row.parent_comment_id === 'string' ? row.parent_comment_id : null,
    body: String(row.body ?? ''),
    moderationStatus: row.moderation_status === 'approved' || row.moderation_status === 'rejected' ? row.moderation_status : 'pending',
    authorNickname: typeof row.author_nickname === 'string' ? row.author_nickname : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

function normalizeCategory(value: unknown): CommunitySubCategory | null {
  return value === 'pain' || value === 'worry' || value === 'today' || value === 'tip' ? value : null;
}

function normalizeAudienceScope(value: unknown): CommunityAudienceScope | null {
  return value === 'everyone' || value === 'same_role' ? value : null;
}

function labelFor(value: CommunitySubCategory) {
  return COMMUNITY_CATEGORIES.find((chip) => chip.value === value)?.label ?? '오늘';
}

function scopeLabel(value: CommunityAudienceScope) {
  return value === 'same_role' ? '같은 롤만' : '모두에게';
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '방금';
  return parsed.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

const communityShellStyle = { background: 'rgba(255,255,255,0.88)', borderTop: '1px solid var(--slc-border)', borderBottom: '1px solid var(--slc-border)', padding: '18px 20px 92px' } as const;
const communityHeaderStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 } as const;
const sectionEyebrowStyle = { display: 'inline-block', margin: '0 0 8px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const sectionTitleStyle = { color: 'var(--slc-text)', fontSize: 21, fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1.25, margin: 0 } as const;
const composeButtonStyle = { width: 44, height: 44, borderRadius: 999, border: 0, background: 'var(--fevio-coral)', color: '#fff', fontSize: 24, fontWeight: 800, boxShadow: '0 12px 26px rgba(185, 97, 75, 0.24)' } as const;
const slimComposeStyle = { width: '100%', marginTop: 16, border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255,255,255,0.9)', color: 'var(--slc-muted)', padding: '13px 16px', textAlign: 'left', fontSize: 13, fontWeight: 850 } as const;
const filterRowStyle = { display: 'flex', gap: 8, overflowX: 'auto', margin: '14px -20px 0', padding: '0 20px 4px' } as const;
const filterStyle = { flex: '0 0 auto', borderRadius: 999, background: 'rgba(255, 255, 255, 0.82)', border: '1px solid var(--slc-border)', color: 'var(--slc-text)', fontSize: 12, fontWeight: 900, padding: '8px 12px' } as const;
const activeFilterStyle = { ...filterStyle, background: 'var(--fevio-coral)', color: '#fff', border: '1px solid transparent' } as const;
const feedStyle = { display: 'grid', marginTop: 12 } as const;
const postStyle = { borderTop: '1px solid var(--slc-border)', padding: '16px 0' } as const;
const postMetaStyle = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850, marginBottom: 8 } as const;
const scopeBadgeStyle = { borderRadius: 999, background: 'rgba(189, 166, 223, 0.18)', color: '#75618D', padding: '4px 8px', fontSize: 10, fontWeight: 900 } as const;
const officialBadgeStyle = { borderRadius: 999, background: 'rgba(109, 135, 123, 0.14)', color: 'var(--fevio-sage-dark)', padding: '4px 8px', fontSize: 10, fontWeight: 900 } as const;
const pendingStyle = { borderRadius: 999, background: 'rgba(189, 166, 223, 0.18)', color: '#75618D', padding: '4px 8px', fontSize: 10, fontWeight: 900 } as const;
const postBodyStyle = { color: 'var(--slc-text)', fontSize: 15, fontWeight: 800, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' } as const;
const postActionRowStyle = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 } as const;
const empathyButtonStyle = { border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255, 255, 255, 0.9)', color: 'var(--slc-text)', padding: '6px 10px', fontSize: 11, fontWeight: 900 } as const;
const activeEmpathyButtonStyle = { ...empathyButtonStyle, background: 'rgba(189, 166, 223, 0.18)', color: '#75618D' } as const;
const categoryStyle = { color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850 } as const;
const commentListStyle = { display: 'grid', gap: 7, marginTop: 10 } as const;
const commentStyle = { borderLeft: '2px solid rgba(189, 166, 223, 0.32)', paddingLeft: 9 } as const;
const commentMetaStyle = { color: 'var(--slc-muted)', fontSize: 10, fontWeight: 850 } as const;
const commentBodyStyle = { color: 'var(--slc-text)', fontSize: 12, fontWeight: 750, lineHeight: 1.4, margin: '3px 0 0' } as const;
const commentFormStyle = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 7, marginTop: 10 } as const;
const commentInputStyle = { minWidth: 0, border: '1px solid var(--slc-border)', borderRadius: 999, padding: '0 12px', font: 'inherit', fontSize: 12, minHeight: 34, background: 'rgba(255,255,255,0.9)' } as const;
const commentButtonStyle = { border: 0, borderRadius: 999, background: 'rgba(189, 166, 223, 0.22)', color: '#75618D', padding: '0 11px', fontSize: 11, fontWeight: 900 } as const;
const emptyStyle = { margin: '16px 0 0', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 } as const;
const sheetBackdropStyle = { position: 'fixed', inset: 0, zIndex: 40, display: 'grid', alignItems: 'end', background: 'rgba(37, 31, 28, 0.22)' } as const;
const sheetStyle = { display: 'grid', gap: 12, borderRadius: '28px 28px 0 0', background: 'rgba(255,255,255,0.98)', padding: '12px 20px 24px', boxShadow: '0 -18px 44px rgba(80, 50, 40, 0.18)' } as const;
const sheetHandleStyle = { justifySelf: 'center', width: 42, height: 4, borderRadius: 999, background: 'rgba(80,50,40,0.18)' } as const;
const sheetTitleStyle = { color: 'var(--slc-text)', fontSize: 18, fontWeight: 950, margin: '4px 0 0' } as const;
const textareaStyle = { minHeight: 108, border: '1px solid var(--slc-border)', borderRadius: 18, padding: 14, resize: 'vertical', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const sheetGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;
const labelStyle = { display: 'grid', gap: 7, color: 'var(--slc-text)', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { minHeight: 42, border: '1px solid var(--slc-border)', borderRadius: 16, padding: '0 12px', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const helperStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 12, fontWeight: 750, lineHeight: 1.45 } as const;
const buttonStyle = { border: 0, borderRadius: 18, background: 'var(--fevio-coral)', color: '#fff', fontSize: 14, fontWeight: 950, minHeight: 46 } as const;
const cancelButtonStyle = { border: 0, background: 'transparent', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 850, minHeight: 36 } as const;
