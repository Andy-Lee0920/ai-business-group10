'use client';

import { useState, type FormEvent } from 'react';

export function AdminSeedForm() {
  const [message, setMessage] = useState('');

  async function submitSeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        body: formData.get('body'),
        audienceScope: formData.get('audienceScope'),
        audienceRole: formData.get('audienceRole'),
        subCategory: formData.get('subCategory'),
      }),
    });
    setMessage(response.ok ? '운영팀 안내를 발행했습니다.' : '발행하지 못했습니다.');
    if (response.ok) form.reset();
  }

  return (
    <form data-testid="admin-seed-form" onSubmit={submitSeed} style={formStyle}>
      <label style={labelStyle}>보기 범위
        <select name="audienceScope" defaultValue="everyone" style={inputStyle}>
          <option value="everyone">모두에게</option>
          <option value="same_role">같은 롤만</option>
        </select>
      </label>
      <label style={labelStyle}>같은 롤 대상
        <select name="audienceRole" defaultValue="primary" style={inputStyle}>
          <option value="primary">당사자</option>
          <option value="partner">파트너</option>
        </select>
      </label>
      <label style={labelStyle}>주제
        <select name="subCategory" defaultValue="today" style={inputStyle}>
          <option value="pain">통증</option>
          <option value="worry">걱정</option>
          <option value="today">오늘</option>
          <option value="tip">팁</option>
        </select>
      </label>
      <label style={labelStyle}>운영팀 안내
        <textarea name="body" required style={textareaStyle} placeholder="closed beta 안내를 작성하세요." />
      </label>
      <button type="submit" style={buttonStyle}>운영팀 안내 발행</button>
      {message ? <p style={messageStyle}>{message}</p> : null}
    </form>
  );
}

const formStyle = { display: 'grid', gap: 12, borderRadius: 24, background: 'rgba(255,255,255,0.88)', border: '1px solid var(--slc-border)', padding: 18 } as const;
const labelStyle = { display: 'grid', gap: 7, color: 'var(--slc-text)', fontSize: 13, fontWeight: 900 } as const;
const inputStyle = { minHeight: 42, border: '1px solid var(--slc-border)', borderRadius: 14, padding: '0 12px', font: 'inherit' } as const;
const textareaStyle = { minHeight: 96, border: '1px solid var(--slc-border)', borderRadius: 16, padding: 14, font: 'inherit', resize: 'vertical' } as const;
const buttonStyle = { border: 0, borderRadius: 16, minHeight: 46, background: 'var(--fevio-sage-dark)', color: '#fff', fontWeight: 950 } as const;
const messageStyle = { margin: 0, color: 'var(--slc-muted)', fontSize: 13, fontWeight: 800 } as const;
