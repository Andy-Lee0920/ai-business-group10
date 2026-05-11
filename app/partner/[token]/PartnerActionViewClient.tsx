'use client';

import { useEffect, useState } from 'react';
import type { PartnerActionViewItem, PartnerViewPayload } from '../../../src/types/partner-view.types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; items: PartnerActionViewItem[] }
  | { status: 'error' };

export function PartnerActionViewClient({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

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

  return <PartnerActionList items={state.items} />;
}

function PartnerActionList({ items }: { items: PartnerActionViewItem[] }) {
  if (items.length === 0) return <p className="notice">지금 공유된 파트너 할 일이 없어요.</p>;

  return (
    <ul className="status-list" aria-label="파트너 할 일" aria-live="polite">
      {items.map((item) => (
        <li key={item.safe_id}>
          <strong>{item.title}</strong>
          <p>{item.description ?? '확인된 설명이 없어요.'}</p>
          <p>{item.partner_action}</p>
          <small>{item.partner_role} · {stateLabel(item.display_state)} · rev {item.sync_revision}</small>
          <p>{item.avoid_prompt}</p>
        </li>
      ))}
    </ul>
  );
}

function stateLabel(state: PartnerActionViewItem['display_state']) {
  if (state === 'completed') return '완료됨';
  if (state === 'revoked') return '이 항목은 더 이상 유효하지 않아요';
  if (state === 'superseded') return '새 항목으로 대체됨';
  if (state === 'changed_since_ack') return '내용이 변경됨';
  return '현재 할 일';
}
