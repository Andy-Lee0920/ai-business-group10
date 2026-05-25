'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { CommunityAudience, CommunityAudienceScope, CommunityCommentListItem, CommunityPostListItem, CommunitySubCategory } from '../../../types/community.types';

const COMMUNITY_FILTERS: { value: CommunitySubCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pain', label: '주사·증상' },
  { value: 'worry', label: '방문 전 확인' },
  { value: 'today', label: '오늘 일정' },
  { value: 'tip', label: '확인 팁' },
];

const COMMUNITY_CATEGORIES: { value: CommunitySubCategory; label: string }[] = [
  { value: 'today', label: '오늘 일정' },
  { value: 'pain', label: '주사·증상' },
  { value: 'worry', label: '방문 전 확인' },
  { value: 'tip', label: '확인 팁' },
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

  useEffect(() => {
    if (!isComposerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsComposerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComposerOpen]);

  const visiblePosts = useMemo(() => {
    const sorted = communityPosts.filter((post) => !isSeedArtifactPost(post)).sort((a, b) => {
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
    <section data-testid="community-preview" aria-label="공유 기록" style={communityShellStyle}>
      <header style={communityHeaderStyle}>
        <div>
          <span style={sectionEyebrowStyle}>공유 기록</span>
          <h2 style={sectionTitleStyle}>병원 안내를 확인한 기록</h2>
          <p style={sectionLeadStyle}>병원에서 확인한 일정, 주사 시간, 방문 후 메모처럼 다시 볼 수 있는 내용만 남겨요.</p>
        </div>
        <button type="button" data-testid="records-compose-button" onClick={() => setIsComposerOpen(true)} style={composeButtonStyle}>＋</button>
      </header>

      <button type="button" onClick={() => setIsComposerOpen(true)} style={slimComposeStyle}>확인한 내용 남기기</button>

      <div aria-label="공유 기록 필터" style={filterRowStyle}>
        {COMMUNITY_FILTERS.map((chip) => (
          <button key={chip.value} type="button" onClick={() => setSelectedCategory(chip.value)} style={chip.value === selectedCategory ? activeFilterStyle : filterStyle}>{chip.label}</button>
        ))}
      </div>

      {isComposerOpen ? (
        <div className="fevio-community-sheet-layer" style={sheetLayerStyle}>
          <button type="button" aria-label="공유 기록 작성 닫기" onClick={() => setIsComposerOpen(false)} style={sheetBackdropStyle} />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-compose-title"
            data-testid="community-post-form"
            onSubmit={submitCommunityPost}
            onClick={(event) => event.stopPropagation()}
            style={sheetStyle}
          >
            <div style={sheetHandleStyle} />
            <div style={sheetHeaderStyle}>
              <h3 id="community-compose-title" style={sheetTitleStyle}>확인한 내용 공유하기</h3>
              <button type="button" aria-label="닫기" onClick={() => setIsComposerOpen(false)} style={sheetCloseButtonStyle}>닫기</button>
            </div>
            <textarea name="body" required placeholder="예: 오비드렐은 안내문 시간과 알림 시간을 같이 맞춰두니 덜 헷갈렸어요." style={textareaStyle} />
            <div style={sheetGridStyle}>
              <label style={labelStyle}>공개 범위
                <select name="audienceScope" defaultValue="everyone" style={inputStyle}>
                  <option value="everyone">전체 사용자</option>
                  <option value="same_role">비슷한 단계 사용자</option>
                </select>
              </label>
              <label style={labelStyle}>주제
                <select name="subCategory" defaultValue="today" style={inputStyle}>
                  {COMMUNITY_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
            </div>
            <p style={helperStyle}>개인정보와 병원명은 빼고, 직접 확인한 일정·시간·준비물만 남겨주세요. 검수 중인 글은 본인에게만 보여요.</p>
            <button type="submit" disabled={isSaving} style={buttonStyle}>{isSaving ? '등록 중' : '올리기'}</button>
            <button type="button" onClick={() => setIsComposerOpen(false)} style={cancelButtonStyle}>취소</button>
          </form>
        </div>
      ) : null}

      <div style={feedStyle}>
        {visiblePosts.length === 0 ? (
          <div style={emptyCardStyle}>
            <strong style={emptyTitleStyle}>아직 공유된 확인 기록이 없어요</strong>
            <p style={emptyBodyStyle}>주사 시간, 병원 방문 후 기억할 점, 안내문을 확인하며 정리한 팁처럼 다시 볼 수 있는 내용부터 남겨보세요.</p>
            <div style={promptRowStyle} aria-label="공유 기록 글감 예시">
              <span style={promptChipStyle}>주사 시간 확인</span>
              <span style={promptChipStyle}>방문 후 메모</span>
              <span style={promptChipStyle}>안내문 확인 팁</span>
            </div>
          </div>
        ) : visiblePosts.map((post) => (
          <article key={post.id} style={postStyle}>
            <div style={postMetaStyle}>
              <span>{post.authorNickname ?? '익명 사용자'}</span>
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
                  <span style={commentMetaStyle}>{comment.authorNickname ?? '공유 기록'} · {comment.moderationStatus === 'pending' ? '댓글 검수 중' : '댓글'}</span>
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
  return COMMUNITY_CATEGORIES.find((chip) => chip.value === value)?.label ?? '오늘 일정';
}

function scopeLabel(value: CommunityAudienceScope) {
  return value === 'same_role' ? '비슷한 단계' : '전체 공개';
}

function isSeedArtifactPost(post: CommunityPostListItem) {
  const body = post.body.trim();
  return /^(same role|everyone) post \d+$/i.test(body) || /^prod approved community smoke [a-f0-9]+$/i.test(body);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '방금';
  return parsed.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

const communityShellStyle = { margin: '0 -4px', borderRadius: 28, background: 'linear-gradient(180deg, rgba(255,253,250,0.9) 0%, rgba(247,239,233,0.78) 100%)', border: '1px solid rgba(233, 222, 214, 0.9)', padding: '18px 16px 92px', boxShadow: '0 18px 46px rgba(47, 41, 38, 0.06)' } as const;
const communityHeaderStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 } as const;
const sectionEyebrowStyle = { display: 'inline-block', margin: '0 0 8px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const sectionTitleStyle = { color: 'var(--slc-text)', fontSize: 21, fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1.25, margin: 0 } as const;
const sectionLeadStyle = { margin: '8px 0 0', color: 'var(--slc-muted)', fontSize: 12, fontWeight: 750, lineHeight: 1.5 } as const;
const composeButtonStyle = { flex: '0 0 auto', width: 44, height: 44, borderRadius: 999, border: 0, background: 'var(--slc-coral-gradient)', color: '#fff', fontSize: 24, fontWeight: 800, boxShadow: '0 12px 26px rgba(185, 97, 75, 0.24)' } as const;
const slimComposeStyle = { width: '100%', marginTop: 16, border: '1px solid rgba(224, 216, 207, 0.82)', borderRadius: 18, background: 'rgba(255,255,255,0.76)', color: 'var(--slc-text)', padding: '14px 15px', textAlign: 'left', fontSize: 13, fontWeight: 900, boxShadow: '0 10px 22px rgba(47, 41, 38, 0.04)' } as const;
const filterRowStyle = { display: 'flex', gap: 8, overflowX: 'auto', margin: '14px -16px 0', padding: '0 16px 4px' } as const;
const filterStyle = { flex: '0 0 auto', borderRadius: 999, background: 'rgba(255, 255, 255, 0.82)', border: '1px solid var(--slc-border)', color: 'var(--slc-text)', fontSize: 12, fontWeight: 900, padding: '8px 12px' } as const;
const activeFilterStyle = { ...filterStyle, background: 'var(--slc-coral)', color: '#fff', border: '1px solid transparent' } as const;
const feedStyle = { display: 'grid', marginTop: 12 } as const;
const postStyle = { borderTop: '1px solid rgba(224, 216, 207, 0.72)', padding: '18px 0' } as const;
const postMetaStyle = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850, marginBottom: 8 } as const;
const scopeBadgeStyle = { borderRadius: 999, background: 'rgba(109, 143, 114, 0.13)', color: 'var(--fevio-sage-dark)', padding: '4px 8px', fontSize: 10, fontWeight: 900 } as const;
const officialBadgeStyle = { borderRadius: 999, background: 'rgba(109, 135, 123, 0.14)', color: 'var(--fevio-sage-dark)', padding: '4px 8px', fontSize: 10, fontWeight: 900 } as const;
const pendingStyle = { borderRadius: 999, background: 'rgba(201, 95, 75, 0.12)', color: 'var(--slc-coral-dark)', padding: '4px 8px', fontSize: 10, fontWeight: 900 } as const;
const postBodyStyle = { color: 'var(--slc-text)', fontSize: 15, fontWeight: 800, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' } as const;
const postActionRowStyle = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 } as const;
const empathyButtonStyle = { border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255, 255, 255, 0.9)', color: 'var(--slc-text)', padding: '6px 10px', fontSize: 11, fontWeight: 900 } as const;
const activeEmpathyButtonStyle = { ...empathyButtonStyle, background: 'rgba(109, 143, 114, 0.13)', color: 'var(--fevio-sage-dark)' } as const;
const categoryStyle = { color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850 } as const;
const commentListStyle = { display: 'grid', gap: 7, marginTop: 10 } as const;
const commentStyle = { borderLeft: '2px solid rgba(109, 143, 114, 0.26)', paddingLeft: 9 } as const;
const commentMetaStyle = { color: 'var(--slc-muted)', fontSize: 10, fontWeight: 850 } as const;
const commentBodyStyle = { color: 'var(--slc-text)', fontSize: 12, fontWeight: 750, lineHeight: 1.4, margin: '3px 0 0' } as const;
const commentFormStyle = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 7, marginTop: 10 } as const;
const commentInputStyle = { minWidth: 0, border: '1px solid var(--slc-border)', borderRadius: 999, padding: '0 12px', font: 'inherit', fontSize: 12, minHeight: 34, background: 'rgba(255,255,255,0.9)' } as const;
const commentButtonStyle = { border: 0, borderRadius: 999, background: 'rgba(109, 143, 114, 0.14)', color: 'var(--fevio-sage-dark)', padding: '0 11px', fontSize: 11, fontWeight: 900 } as const;
const emptyCardStyle = { display: 'grid', gap: 10, marginTop: 16, border: '1px solid rgba(224, 216, 207, 0.82)', borderRadius: 22, background: 'rgba(255, 252, 247, 0.82)', padding: 16, boxShadow: '0 12px 28px rgba(47, 41, 38, 0.05)' } as const;
const emptyTitleStyle = { color: 'var(--slc-text)', fontSize: 16, fontWeight: 950, letterSpacing: '-0.03em' } as const;
const emptyBodyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750, lineHeight: 1.55 } as const;
const promptRowStyle = { display: 'flex', flexWrap: 'wrap', gap: 7 } as const;
const promptChipStyle = { borderRadius: 999, background: 'rgba(109, 135, 123, 0.12)', color: 'var(--fevio-sage-dark)', padding: '6px 9px', fontSize: 11, fontWeight: 900 } as const;
const sheetLayerStyle = { position: 'fixed', inset: 0, zIndex: 80, display: 'grid', alignItems: 'end' } as const;
const sheetBackdropStyle = { position: 'absolute', inset: 0, border: 0, background: 'rgba(37, 31, 28, 0.28)', padding: 0 } as const;
const sheetStyle = { position: 'relative', display: 'grid', gap: 12, width: '100%', maxWidth: 'var(--fevio-mobile-frame-max)', justifySelf: 'center', maxHeight: 'min(78dvh, 720px)', overflowY: 'auto', borderRadius: '28px 28px 0 0', background: 'rgba(255,255,255,0.98)', padding: '12px 20px calc(30px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -18px 44px rgba(80, 50, 40, 0.18)' } as const;
const sheetHandleStyle = { justifySelf: 'center', width: 42, height: 4, borderRadius: 999, background: 'rgba(80,50,40,0.18)' } as const;
const sheetHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } as const;
const sheetTitleStyle = { color: 'var(--slc-text)', fontSize: 18, fontWeight: 950, margin: 0 } as const;
const sheetCloseButtonStyle = { flex: '0 0 auto', border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255, 252, 250, 0.92)', color: 'var(--slc-muted)', padding: '8px 12px', fontSize: 12, fontWeight: 900 } as const;
const textareaStyle = { minHeight: 108, border: '1px solid var(--slc-border)', borderRadius: 18, padding: 14, resize: 'vertical', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const sheetGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const;
const labelStyle = { display: 'grid', gap: 7, color: 'var(--slc-text)', fontSize: 12, fontWeight: 900 } as const;
const inputStyle = { minHeight: 42, border: '1px solid var(--slc-border)', borderRadius: 16, padding: '0 12px', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 252, 250, 0.9)' } as const;
const helperStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 12, fontWeight: 750, lineHeight: 1.45 } as const;
const buttonStyle = { border: 0, borderRadius: 18, background: 'var(--slc-coral-gradient)', color: '#fff', fontSize: 14, fontWeight: 950, minHeight: 46 } as const;
const cancelButtonStyle = { border: 0, background: 'transparent', color: 'var(--slc-muted)', fontSize: 13, fontWeight: 850, minHeight: 36 } as const;
