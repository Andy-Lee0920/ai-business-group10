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
  const { data: signal } = useSWR<PartnerSurfaceSignal>(`/api/partner/${encodeURIComponent(token)}/surface`, fetcher, { refreshInterval: 30_000 });

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const load = () => {
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
          if (mounted) timer = setTimeout(load, 5_000);
        });
    };

    load();

    return () => {
      mounted = false;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  if (state.status === 'loading') return <p className="lead">파트너 할 일을 불러오는 중이에요.</p>;
  if (state.status === 'error') return <p className="notice">이 링크는 만료되었거나 더 이상 유효하지 않아요.</p>;

  return <PartnerRoleSurface items={state.items} live signal={signal} />;
}
