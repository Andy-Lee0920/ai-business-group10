import { getPresentationPartnerView } from '../../../src/lib/presentation-demo-data';
import type { PartnerActionViewItem } from '../../../src/types/partner-view.types';
import { PartnerActionViewClient } from './PartnerActionViewClient';

export default async function PartnerActionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const demoItems = token === 'demo' ? getPresentationPartnerView() : null;

  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <p className="eyebrow">Partner Action View</p>
        <h2>파트너 오늘 할 일</h2>
        <p className="lead">사용자가 확인한 실행 내용만 보여주는 읽기 전용 링크예요.</p>
        {demoItems ? <PartnerActionList items={demoItems} /> : <PartnerActionViewClient token={token} />}
      </section>
    </main>
  );
}

function PartnerActionList({ items }: { items: PartnerActionViewItem[] }) {
  if (items.length === 0) return <p className="notice">지금 공유된 파트너 할 일이 없어요.</p>;

  return (
    <ul className="status-list" aria-label="파트너 할 일">
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
