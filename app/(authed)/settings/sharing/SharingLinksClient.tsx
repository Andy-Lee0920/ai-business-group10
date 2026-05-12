'use client';

import { useEffect, useState } from 'react';
import type { PartnerShareLinkSummary } from '../../../../src/types/partner-share-link.types';

type SharingScope = 'basic' | 'care' | 'emotional';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; links: PartnerShareLinkSummary[] }
  | { status: 'error'; message: string };

type ScopeState =
  | { status: 'loading' }
  | { status: 'missing'; message: string }
  | { status: 'ready'; sharingScope: SharingScope; partnerConnected: boolean; cycleId: string; saving?: boolean }
  | { status: 'error'; message: string };

type RevokeTarget = PartnerShareLinkSummary | null;

type SharingScopePayload = {
  cycleId?: unknown;
  sharingScope?: unknown;
  partnerConnected?: unknown;
};

const SCOPE_OPTIONS: Array<{ value: SharingScope; label: string; description: string }> = [
  { value: 'basic', label: '일정만', description: '다음 일정과 큰 행동만 보여요.' },
  { value: 'care', label: '케어 공유', description: '실행 보조에 필요한 항목만 보여요.' },
  { value: 'emotional', label: '감정까지', description: '정서 지원 문구를 추가해요.' },
];

export function SharingLinksClient() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [scopeState, setScopeState] = useState<ScopeState>({ status: 'loading' });
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

    fetch('/api/sharing-scope')
      .then((response) => {
        if (response.status === 404) return null;
        return response.ok ? response.json() : Promise.reject(new Error('공유 범위를 불러오지 못했어요.'));
      })
      .then((payload: SharingScopePayload | null) => {
        if (!mounted) return;
        const parsed = parseScopePayload(payload);
        if (parsed) setScopeState({ status: 'ready', ...parsed });
        else setScopeState({ status: 'missing', message: '파트너 계정 연결 후 공유 범위를 저장할 수 있어요.' });
      })
      .catch((error: unknown) => {
        if (mounted) setScopeState({ status: 'error', message: messageOf(error) });
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function updateSharingScope(sharingScope: SharingScope) {
    if (scopeState.status !== 'ready' || scopeState.sharingScope === sharingScope) return;
    setScopeState({ ...scopeState, saving: true });
    const response = await fetch('/api/sharing-scope', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sharingScope }),
    });
    if (!response.ok) {
      setScopeState({ status: 'error', message: '공유 범위를 저장하지 못했어요.' });
      return;
    }
    const parsed = parseScopePayload((await response.json()) as SharingScopePayload);
    if (parsed) setScopeState({ status: 'ready', ...parsed });
  }

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
      <SharingScopeControl state={scopeState} onChange={updateSharingScope} />
      <LinkList links={state.links} onRevoke={setTarget} />
      {target ? <RevokeDialog onCancel={() => setTarget(null)} onConfirm={revokeSelected} /> : null}
    </>
  );
}

function SharingScopeControl({ state, onChange }: { state: ScopeState; onChange: (scope: SharingScope) => void }) {
  if (state.status === 'loading') return <p className="lead">공유 범위를 확인하는 중이에요.</p>;
  if (state.status === 'missing') return <p className="fevio-notice fevio-notice--sage">{state.message}</p>;
  if (state.status === 'error') return <p className="notice">{state.message}</p>;

  return (
    <section className="notice" aria-label="파트너 공유 범위">
      <p className="eyebrow">공유 범위</p>
      <h2>파트너가 볼 수 있는 범위</h2>
      <p>{state.partnerConnected ? '연결된 파트너 화면에 바로 반영됩니다.' : '파트너 연결 전에도 기본 범위를 정해둘 수 있어요.'}</p>
      <div className="cta-row" role="group" aria-label="공유 범위 선택">
        {SCOPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={state.sharingScope === option.value ? 'fevio-button fevio-button--primary' : 'fevio-button fevio-button--secondary'}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={state.saving === true}
            aria-pressed={state.sharingScope === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p>{SCOPE_OPTIONS.find((option) => option.value === state.sharingScope)?.description}</p>
    </section>
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

function parseScopePayload(payload: SharingScopePayload | null) {
  if (!payload || typeof payload.cycleId !== 'string' || !isSharingScope(payload.sharingScope)) return null;
  return {
    cycleId: payload.cycleId,
    sharingScope: payload.sharingScope,
    partnerConnected: payload.partnerConnected === true,
  };
}

function isSharingScope(value: unknown): value is SharingScope {
  return value === 'basic' || value === 'care' || value === 'emotional';
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : '공유 링크 상태를 확인하지 못했어요.';
}
