'use client';

import { useState } from 'react';
import styles from './care-surface-primitives.module.css';

export function PartnerInviteCard() {
  const [hidden, setHidden] = useState(false);
  const [message, setMessage] = useState('');
  if (hidden) return null;

  async function shareInvite() {
    const url = `${window.location.origin}/partner/demo-invite`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Fevio 파트너 초대', text: '역할에 맞는 케어 화면을 함께 볼 수 있어요.', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setMessage('초대 링크가 준비됐어요.');
    } catch {
      setMessage('초대 링크를 다시 확인할 수 있어요.');
    }
  }

  return (
    <section className={styles.partnerInviteCard} data-testid="partner-invite-card" aria-label="파트너 초대 준비">
      <div>
        <small>공유 준비</small>
        <h2>파트너와 함께 볼 준비가 됐어요</h2>
        <p>초대 링크를 보내면 파트너는 역할에 맞는 화면을 보게 됩니다.</p>
      </div>
      <div className={styles.partnerInviteActions}>
        <button type="button" onClick={shareInvite}>초대 링크 공유</button>
        <button type="button" onClick={() => setHidden(true)}>나중에</button>
      </div>
      {message ? <p className={styles.partnerInviteMessage}>{message}</p> : null}
    </section>
  );
}
