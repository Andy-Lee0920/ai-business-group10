'use client';

import { useState, useTransition } from 'react';

type ModerationTarget = 'post' | 'comment';

interface QueueItem {
  id: string;
  body?: string | null;
  moderation_status?: string | null;
  created_at?: string | null;
}

interface AdminModerationPanelProps {
  posts: QueueItem[];
  comments: QueueItem[];
}

export function AdminModerationPanel({ posts, comments }: AdminModerationPanelProps) {
  const [pendingPosts, setPendingPosts] = useState(posts);
  const [pendingComments, setPendingComments] = useState(comments);
  const [isPending, startTransition] = useTransition();

  function update(target: ModerationTarget, id: string, action: 'approve' | 'reject') {
    startTransition(async () => {
      const response = await fetch(`/api/admin/moderation/${target}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!response.ok) return;
      if (target === 'post') setPendingPosts((current) => current.filter((item) => item.id !== id));
      if (target === 'comment') setPendingComments((current) => current.filter((item) => item.id !== id));
    });
  }

  return (
    <div style={stackStyle}>
      <Queue title="커뮤니티 글" target="post" items={pendingPosts} disabled={isPending} onAction={update} />
      <Queue title="댓글" target="comment" items={pendingComments} disabled={isPending} onAction={update} />
    </div>
  );
}

function Queue({ title, target, items, disabled, onAction }: { title: string; target: ModerationTarget; items: QueueItem[]; disabled: boolean; onAction: (target: ModerationTarget, id: string, action: 'approve' | 'reject') => void }) {
  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {items.length === 0 ? <p style={mutedStyle}>검수 대기 항목이 없습니다.</p> : items.map((item) => (
        <article key={item.id} style={itemStyle}>
          <p style={bodyStyle}>{item.body || '내용 없음'}</p>
          <div style={buttonRowStyle}>
            <button type="button" disabled={disabled} onClick={() => onAction(target, item.id, 'approve')} style={approveStyle}>승인</button>
            <button type="button" disabled={disabled} onClick={() => onAction(target, item.id, 'reject')} style={rejectStyle}>거절</button>
          </div>
        </article>
      ))}
    </section>
  );
}

const stackStyle = { display: 'grid', gap: 16 } as const;
const cardStyle = { borderRadius: 24, background: 'rgba(255,255,255,0.88)', border: '1px solid var(--slc-border)', padding: 18 } as const;
const sectionTitleStyle = { margin: '0 0 12px', color: 'var(--slc-text)', fontSize: 18, fontWeight: 950 } as const;
const mutedStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750 } as const;
const itemStyle = { display: 'grid', gap: 12, borderTop: '1px solid var(--slc-border)', padding: '14px 0' } as const;
const bodyStyle = { margin: 0, color: 'var(--slc-text)', fontSize: 14, fontWeight: 800, lineHeight: 1.45 } as const;
const buttonRowStyle = { display: 'flex', gap: 8 } as const;
const approveStyle = { border: 0, borderRadius: 14, background: 'var(--fevio-sage-dark)', color: '#fff', padding: '10px 14px', fontWeight: 900 } as const;
const rejectStyle = { border: '1px solid var(--slc-border)', borderRadius: 14, background: '#fff', color: 'var(--fevio-coral)', padding: '10px 14px', fontWeight: 900 } as const;
