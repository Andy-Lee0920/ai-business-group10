'use client';

import { useState, type FormEvent } from 'react';

interface CommunityNicknameFormProps {
  nickname: string;
  remainingDays: number;
}

export function CommunityNicknameForm({ nickname, remainingDays }: CommunityNicknameFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const blocked = remainingDays > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;
    const formData = new FormData(event.currentTarget);
    const nextNickname = String(formData.get('nickname') ?? '').trim();
    if (!nextNickname) return;
    setSaving(true);
    try {
      const response = await fetch('/api/community/nickname', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nickname: nextNickname }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; remainingDays?: number };
      setMessage(response.ok ? '닉네임을 저장했어요. 30일 뒤 다시 바꿀 수 있어요.' : payload.error === 'nickname_cooldown' ? `아직 ${payload.remainingDays ?? remainingDays}일 남았어요.` : '닉네임을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <label style={{ display: 'grid', gap: 8, fontSize: 13, fontWeight: 900, color: 'var(--slc-text)' }}>
        커뮤니티 닉네임
        <input name="nickname" defaultValue={nickname} disabled={blocked || saving} maxLength={24} style={{ minHeight: 46, borderRadius: 16, border: '1px solid var(--slc-border)', padding: '0 14px', font: 'inherit' }} />
      </label>
      <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 750, lineHeight: 1.5 }}>닉네임은 30일에 1회만 수정할 수 있어요.{blocked ? ` 다음 변경까지 ${remainingDays}일 남았습니다.` : ' 지금 변경할 수 있습니다.'}</p>
      <button type="submit" disabled={blocked || saving} style={{ border: 0, borderRadius: 18, background: 'var(--fevio-coral)', color: '#fff', minHeight: 46, fontSize: 14, fontWeight: 950, opacity: blocked || saving ? 0.58 : 1 }}>{saving ? '저장 중' : '닉네임 저장'}</button>
      {message ? <p style={{ margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 }}>{message}</p> : null}
    </form>
  );
}
