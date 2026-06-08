import type { CardType } from '../../types/care-cards.types';
import type { PartnerActionViewItem } from '../../types/partner-view.types';
import { SLCIllustration } from '../../components/slc-illustration';
import { slcAssets } from '../../design/slc-assets';
import { partnerStateCopy } from './partner-state';

interface Props {
  items: PartnerActionViewItem[];
  hasRecentClinicUpdate?: boolean;
}

export function PartnerView({ items, hasRecentClinicUpdate = false }: Props) {
  const completedItems = items.filter((it) => it.display_state === 'completed');
  const pendingItems = items.filter((it) => it.display_state !== 'completed');

  const stateCopy = partnerStateCopy(items.length === 0 ? 'linked_no_schedule' : 'linked_with_schedule');

  return (
    <div style={{ padding: '60px 24px 24px' }}>
      <header style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 14, alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 13, color: '#B5A89E', marginBottom: 4 }}>파트너 뷰 · 읽기 전용</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--slc-text)', marginBottom: 8 }}>{stateCopy.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--slc-muted)', lineHeight: 1.55, margin: 0 }}>{stateCopy.description}</p>
        </div>
        <SLCIllustration asset={slcAssets.partner.readonly} size="icon" priority style={{ width: 84, justifySelf: 'end' }} />
      </header>

      {hasRecentClinicUpdate && (
        <div style={{ background: '#FFF8F5', borderRadius: 16, padding: '14px 18px', border: '1.5px solid #F4D4C8', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--slc-warning)', fontWeight: 600, margin: 0 }}>오늘 병원 방문 후 일정이 변경됐어요</p>
        </div>
      )}

      {completedItems.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slc-muted)', marginBottom: 12 }}>완료</h2>
          {completedItems.map((item) => {
            const time = formatPartnerItemTime(item.scheduled_at);
            return (
              <div key={item.safe_id} style={{
                background: '#F7F5F2', borderRadius: 14, padding: '12px 16px',
                marginBottom: 8, display: 'grid', gap: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, color: '#6B5E55' }}>{time} {partnerItemLabel(item.card_type)} 확인됐어요</span>
                  <span style={{ fontSize: 12, color: 'var(--slc-muted)', fontWeight: 600 }}>읽기 전용</span>
                </div>
                <small style={{ color: '#8B7E74', lineHeight: 1.45 }}>{item.partner_action}</small>
              </div>
            );
          })}
        </section>
      )}

      {pendingItems.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slc-muted)', marginBottom: 12 }}>다음 일정</h2>
          {pendingItems.map((item) => {
            const time = formatPartnerItemTime(item.scheduled_at);
            return (
              <div key={item.safe_id} style={{
                background: '#fff', borderRadius: 14, padding: '12px 16px',
                marginBottom: 8, border: '1.5px solid var(--slc-border)',
                display: 'grid', gap: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, color: 'var(--slc-text)', fontWeight: 500 }}>다음은 {time} {partnerItemLabel(item.card_type)} 예정이에요</span>
                  <span style={{ fontSize: 12, color: 'var(--slc-muted)' }}>읽기 전용</span>
                </div>
                <small style={{ color: '#8B7E74', lineHeight: 1.45 }}>{item.partner_action}</small>
              </div>
            );
          })}
        </section>
      )}

      {items.length === 0 && (
        <p style={{ color: '#B5A89E', textAlign: 'center', fontSize: 15, marginTop: 60 }}>
          {stateCopy.title}
        </p>
      )}
    </div>
  );
}

function partnerItemLabel(type: CardType) {
  if (type === 'injection') return '주사 일정';
  if (type === 'medication') return '복약 일정';
  if (type === 'clinic_visit' || type === 'clinic_confirmation') return '병원 일정';
  return '도움 일정';
}

function formatPartnerItemTime(scheduledAt: string | null) {
  if (!scheduledAt) return '시간 미정';
  return new Date(scheduledAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}
