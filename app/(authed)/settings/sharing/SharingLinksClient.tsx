'use client';

import { useEffect, useState } from 'react';
import type { PartnerShareLinkSummary } from '../../../../src/types/partner-share-link.types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; links: PartnerShareLinkSummary[] }
  | { status: 'error'; message: string };

type RevokeTarget = PartnerShareLinkSummary | null;

export function SharingLinksClient() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [target, setTarget] = useState<RevokeTarget>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/partner-share-links')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('공유 링크를 불러오지 못했어요.'))))
      .then((payload: { links: PartnerShareLinkSummary[] }) => {
        if (mounted) setState({ status: 'ready', links: payload.links });
      })
      .catch((error: unknown) => {
        if (mounted) setState({ status: 'error', message: messageOf(error) });
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function revokeSelected() {
    if (!target || state.status !== 'ready') return;
    const response = await fetch(`/api/partner-share-links/${encodeURIComponent(target.id)}/revoke`, {
      method: 'POST',
    });
    if (!response.ok) {
      setState({ status: 'error', message: '공유 링크를 회수하지 못했어요.' });
      setTarget(null);
      return;
    }
    const result = (await response.json()) as { revoked_at: string };
    setState({
      status: 'ready',
      links: state.links.map((link) => (link.id === target.id ? { ...link, revokedAt: result.revoked_at } : link)),
    });
    setTarget(null);
  }

  if (state.status === 'loading') return <p className="lead">공유 링크를 불러오는 중이에요.</p>;
  if (state.status === 'error') return <p className="notice">{state.message}</p>;

  return (
    <>
      <LinkList links={state.links} onRevoke={setTarget} />
      {target ? <RevokeDialog onCancel={() => setTarget(null)} onConfirm={revokeSelected} /> : null}
    </>
  );
}

function LinkList({ links, onRevoke }: { links: PartnerShareLinkSummary[]; onRevoke: (link: PartnerShareLinkSummary) => void }) {
  if (links.length === 0) return <p className="fevio-notice fevio-notice--sage">활성 파트너 공유 링크가 없어요.</p>;

  return (
    <ul className="status-list" aria-label="파트너 공유 링크 목록">
      {links.map((link) => (
        <li key={link.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <strong>파트너 링크</strong>
            {link.revokedAt ? <span className="fevio-badge fevio-badge--neutral">회수됨</span> : <span className="fevio-badge fevio-badge--sage">활성</span>}
          </div>
          <p>만료 예정: {formatDate(link.expiresAt)}</p>
          <p>마지막 접근: {link.lastAccessedAt ? formatDate(link.lastAccessedAt) : '아직 없음'}</p>
          {link.revokedAt ? null : (
            <button className="fevio-button fevio-button--secondary" type="button" onClick={() => onRevoke(link)}>
              링크 회수
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function RevokeDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="notice" role="dialog" aria-modal="true" aria-labelledby="revoke-title">
      <h2 id="revoke-title">파트너 링크 회수</h2>
      <p>이 링크는 즉시 무효화됩니다. 계속할까요?</p>
      <div className="cta-row">
        <button className="fevio-button fevio-button--primary" type="button" onClick={onConfirm}>
          계속 회수
        </button>
        <button className="fevio-button fevio-button--ghost" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : '공유 링크 상태를 확인하지 못했어요.';
}
