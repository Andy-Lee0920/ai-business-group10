'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { PartnerSurfaceSignal } from '../../../src/types/care-surface.types';
import type { PartnerActionViewItem, PartnerViewPayload } from '../../../src/types/partner-view.types';
import { PartnerRoleSurface } from './PartnerRoleSurface';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; items: PartnerActionViewItem[] }
  | { status: 'error' };

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((response) => (response.ok ? response.json() : Promise.reject(new Error('invalid'))));

export function PartnerActionViewClient({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [assistedIds, setAssistedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [assistingIds, setAssistingIds] = useState<ReadonlySet<string>>(() => new Set());
  const { data: signal } = useSWR<PartnerSurfaceSignal>(`/api/partner/${encodeURIComponent(token)}/surface`, fetcher, { refreshInterval: 30_000 });

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const load = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        timer = setTimeout(load, 3_000);
        return;
      }
      controller?.abort();
      controller = new AbortController();
      fetch(`/api/partner/${encodeURIComponent(token)}/cards`, { cache: 'no-store', signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('invalid'))))
        .then((payload: PartnerViewPayload) => {
          if (mounted) setState({ status: 'ready', items: payload.items });
        })
        .catch((error: Error) => {
          if (mounted && error.name !== 'AbortError') setState({ status: 'error' });
        })
        .finally(() => {
          if (mounted) timer = setTimeout(load, 3_000);
        });
    };

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer) clearTimeout(timer);
      timer = null;
      load();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    load();

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  async function recordAssist(item: PartnerActionViewItem) {
    if (assistedIds.has(item.safe_id) || assistingIds.has(item.safe_id)) return;
    setAssistingIds((current) => new Set([...current, item.safe_id]));
    try {
      const response = await fetch(`/api/partner/${encodeURIComponent(token)}/assist`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_assist',
          cardId: item.safe_id,
          actualTime: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('partner_assist_failed');
      setAssistedIds((current) => new Set([...current, item.safe_id]));
    } finally {
      setAssistingIds((current) => {
        const next = new Set(current);
        next.delete(item.safe_id);
        return next;
      });
    }
  }

  if (state.status === 'loading') return <p className="lead">파트너 할 일을 불러오는 중이에요.</p>;
  if (state.status === 'error') return <p className="notice">이 링크는 만료되었거나 더 이상 유효하지 않아요.</p>;

  return (
    <PartnerRoleSurface
      assistedIds={assistedIds}
      assistingIds={assistingIds}
      items={state.items}
      live
      onAssist={recordAssist}
      signal={signal}
    />
  );
}
