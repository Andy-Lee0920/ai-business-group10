'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { CommunityAudience, CommunityPostListItem, CommunitySubCategory } from '../../../types/community.types';

const COMMUNITY_CHIPS: { value: CommunitySubCategory; label: string }[] = [
  { value: 'pain', label: '통증' },
  { value: 'worry', label: '걱정' },
  { value: 'today', label: '오늘' },
  { value: 'tip', label: '팁' },
];

interface CommunityPreviewProps {
  posts: CommunityPostListItem[];
  audience: CommunityAudience;
}

export function CommunityPreview({ posts, audience }: CommunityPreviewProps) {
  const [communityPosts, setCommunityPosts] = useState(posts);
  const [selectedCategory, setSelectedCategory] = useState<CommunitySubCategory>('today');
  const [isSaving, setIsSaving] = useState(false);
  const visiblePosts = useMemo(() => communityPosts.filter((post) => post.subCategory === selectedCategory), [communityPosts, selectedCategory]);

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

  async function submitCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    if (!body) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body, mood: null, subCategory: selectedCategory, audience }),
      });
      const payload = await response.json().catch(() => ({})) as { post?: Record<string, unknown> };
      const post = payload.post;
      if (response.ok && post) {
        setCommunityPosts((current) => [normalizePost(post, selectedCategory, audience), ...current]);
        form.reset();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="커뮤니티" style={{ padding: '0 16px 0' }}>
      <article data-testid="community-preview" style={secondaryCardStyle}>
        <span style={sectionEyebrowStyle}>커뮤니티</span>
        <h2 style={sectionTitleStyle}>같은 역할의 사람들과 안전하게 공감해요</h2>
        <p style={sectionBodyStyle}>{audience} 피드에 글을 남기면 운영팀 검수 전까지 나에게만 검수 중으로 보입니다.</p>
        <div style={chipRowStyle}>
          {COMMUNITY_CHIPS.map((chip) => (
            <button key={chip.value} type="button" onClick={() => setSelectedCategory(chip.value)} style={chip.value === selectedCategory ? activeChipStyle : chipStyle}>{chip.label}</button>
          ))}
        </div>

        <form data-testid="community-post-form" onSubmit={submitCommunityPost} style={formStyle}>
          <textarea name="body" required placeholder="같은 역할의 사람들에게 남길 말을 적어주세요." style={textareaStyle} />
          <button type="submit" disabled={isSaving} style={buttonStyle}>{isSaving ? '등록 중' : '커뮤니티에 남기기'}</button>
        </form>

        <div style={listStyle}>
          {visiblePosts.length === 0 ? (
            <p style={emptyStyle}>아직 이 주제의 글이 없어요.</p>
          ) : visiblePosts.map((post) => (
            <article key={post.id} style={postStyle}>
              <div style={postMetaStyle}>{labelFor(post.subCategory)} · {post.isOfficial ? '운영팀 안내' : post.audience}</div>
              <p style={postBodyStyle}>{post.body}</p>
              <div style={postActionRowStyle}>
                <button type="button" onClick={() => toggleEmpathy(post)} style={post.empathyActive ? activeEmpathyButtonStyle : empathyButtonStyle}>공감 {post.empathyCount ?? 0}</button>
                {post.moderationStatus === 'pending' ? <span style={pendingStyle}>검수 중</span> : null}
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function normalizePost(row: Record<string, unknown>, fallbackCategory: CommunitySubCategory, fallbackAudience: CommunityAudience): CommunityPostListItem {
  return {
    id: String(row.id),
    body: String(row.body ?? ''),
    mood: typeof row.mood === 'string' ? row.mood : null,
    subCategory: isCategory(row.sub_category) ? row.sub_category : fallbackCategory,
    audience: row.audience === 'partner_feed' ? 'partner_feed' : fallbackAudience,
    moderationStatus: row.moderation_status === 'approved' || row.moderation_status === 'rejected' ? row.moderation_status : 'pending',
    isOfficial: row.is_official === true,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    empathyCount: typeof row.empathy_count === 'number' ? row.empathy_count : 0,
    empathyActive: row.empathy_active === true,
  };
}

function isCategory(value: unknown): value is CommunitySubCategory {
  return value === 'pain' || value === 'worry' || value === 'today' || value === 'tip';
}

function labelFor(value: CommunitySubCategory) {
  return COMMUNITY_CHIPS.find((chip) => chip.value === value)?.label ?? '오늘';
}

const secondaryCardStyle = { borderRadius: 28, background: 'rgba(248, 244, 255, 0.76)', border: '1px solid var(--slc-border)', boxShadow: '0 18px 48px rgba(80, 50, 40, 0.08)', padding: 22 } as const;
const sectionEyebrowStyle = { display: 'inline-block', margin: '0 0 8px', color: 'var(--fevio-sage-dark)', fontSize: 12, fontWeight: 900 } as const;
const sectionTitleStyle = { color: 'var(--slc-text)', fontSize: 21, fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1.25, margin: 0 } as const;
const sectionBodyStyle = { color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750, lineHeight: 1.55, margin: '10px 0 0' } as const;
const chipRowStyle = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 } as const;
const chipStyle = { borderRadius: 999, background: 'rgba(255, 255, 255, 0.82)', border: '1px solid var(--slc-border)', color: 'var(--slc-text)', fontSize: 12, fontWeight: 900, padding: '8px 11px' } as const;
const activeChipStyle = { ...chipStyle, background: 'var(--fevio-coral)', color: '#fff', border: '1px solid transparent' } as const;
const formStyle = { display: 'grid', gap: 10, marginTop: 16 } as const;
const textareaStyle = { minHeight: 72, border: '1px solid var(--slc-border)', borderRadius: 18, padding: 14, resize: 'vertical', font: 'inherit', color: 'var(--slc-text)', background: 'rgba(255, 255, 255, 0.84)' } as const;
const buttonStyle = { border: 0, borderRadius: 18, background: 'var(--fevio-sage-dark)', color: '#fff', fontSize: 14, fontWeight: 950, minHeight: 44 } as const;
const listStyle = { display: 'grid', gap: 10, marginTop: 16 } as const;
const postStyle = { borderRadius: 20, background: 'rgba(255, 255, 255, 0.82)', border: '1px solid var(--slc-border)', padding: 14 } as const;
const postMetaStyle = { color: 'var(--slc-muted)', fontSize: 11, fontWeight: 850, marginBottom: 7 } as const;
const postBodyStyle = { color: 'var(--slc-text)', fontSize: 14, fontWeight: 800, lineHeight: 1.45, margin: 0 } as const;
const postActionRowStyle = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 } as const;
const empathyButtonStyle = { border: '1px solid var(--slc-border)', borderRadius: 999, background: 'rgba(255, 255, 255, 0.9)', color: 'var(--slc-text)', padding: '6px 9px', fontSize: 11, fontWeight: 900 } as const;
const activeEmpathyButtonStyle = { ...empathyButtonStyle, background: 'rgba(189, 166, 223, 0.18)', color: '#75618D' } as const;
const pendingStyle = { display: 'inline-block', borderRadius: 999, background: 'rgba(189, 166, 223, 0.18)', color: '#75618D', padding: '6px 9px', fontSize: 11, fontWeight: 900 } as const;
const emptyStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 } as const;

