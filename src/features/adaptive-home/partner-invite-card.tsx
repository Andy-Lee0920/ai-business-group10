'use client';

import { useState } from 'react';
import styles from './care-surface-primitives.module.css';

type InviteState =
  | { status: 'idle'; url: '' }
  | { status: 'loading'; url: '' }
  | { status: 'ready'; url: string; expiresAt: string | null }
  | { status: 'error'; url: ''; message: string };

type PartnerInviteResponse = {
  url?: unknown;
  expires_at?: unknown;
};

export function PartnerInviteCard() {
  const [hidden, setHidden] = useState(false);
  const [state, setState] = useState<InviteState>({ status: 'idle', url: '' });
  if (hidden) return null;

  async function shareInvite() {
    setState({ status: 'loading', url: '' });
    try {
      const response = await fetch('/api/partner-share-links', { method: 'POST', cache: 'no-store' });
      if (!response.ok) {
        setState({ status: 'error', url: '', message: response.status === 401 ? '로그인하면 실제 초대 링크를 만들 수 있어요.' : '초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.' });
        return;
      }

      const payload = (await response.json()) as PartnerInviteResponse;
      if (typeof payload.url !== 'string') {
        setState({ status: 'error', url: '', message: '초대 링크 응답을 확인하지 못했어요.' });
        return;
      }

      await shareOrCopy(payload.url);
      setState({
        status: 'ready',
        url: payload.url,
        expiresAt: typeof payload.expires_at === 'string' ? payload.expires_at : null,
      });
    } catch {
      setState({ status: 'error', url: '', message: '초대 링크를 다시 확인할 수 있어요.' });
    }
  }

  const message = messageFor(state);

  return (
    <section className={styles.partnerInviteCard} data-testid="partner-invite-card" aria-label="파트너 초대 준비">
      <div>
        <small>공유 준비</small>
        <h2>파트너와 함께 볼 준비가 됐어요</h2>
        <p>초대 링크를 보내면 파트너는 역할에 맞는 화면을 보게 됩니다.</p>
      </div>
      <div className={styles.partnerInviteActions}>
        <button type="button" onClick={shareInvite} disabled={state.status === 'loading'}>{state.status === 'loading' ? '링크 생성 중' : '초대 링크 공유'}</button>
        <button type="button" onClick={() => setHidden(true)}>나중에</button>
      </div>
      {message ? <p className={styles.partnerInviteMessage}>{message}</p> : null}
      {state.status === 'ready' ? <code className={styles.partnerInviteLink}>{state.url}</code> : null}
    </section>
  );
}

async function shareOrCopy(url: string) {
  if (navigator.share) {
    await navigator.share({ title: 'Fevio 파트너 초대', text: '역할에 맞는 케어 화면을 함께 볼 수 있어요.', url });
    return;
  }
  if (navigator.clipboard) await navigator.clipboard.writeText(url);
}

function messageFor(state: InviteState) {
  if (state.status === 'ready') {
    return state.expiresAt ? `초대 링크가 준비됐어요. ${formatExpiry(state.expiresAt)}까지 사용할 수 있어요.` : '초대 링크가 준비됐어요.';
  }
  if (state.status === 'error') return state.message;
  return '';
}

function formatExpiry(value: string) {
  try {
    return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value));
  } catch {
    return '7일 뒤';
  }
}
