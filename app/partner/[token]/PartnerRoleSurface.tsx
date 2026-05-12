import { Badge, Card, StatusBadge } from '../../../src/components/ui';
import { PartnerAvatar } from '../../../src/design/couple-avatars';
import type { PartnerActionViewItem } from '../../../src/types/partner-view.types';
import styles from './partner-role-surface.module.css';

export function PartnerRoleSurface({ items, live = false }: { items: PartnerActionViewItem[]; live?: boolean }) {
  if (items.length === 0) return <p className="notice">지금 공유된 파트너 할 일이 없어요.</p>;

  const primary = items[0];
  const supporting = items.slice(1);

  return (
    <section className={styles.surface} aria-label="파트너 역할 카드" aria-live={live ? 'polite' : undefined}>
      <Card as="section" className={styles.roleHero} aria-labelledby="partner-primary-role-title">
        <div className={styles.kickerRow}>
          <span className={styles.identityMark}>
            <PartnerAvatar className={styles.partnerAvatar} />
            <Badge tone={toneFor(primary.card_type)}>오늘의 케어</Badge>
          </span>
          <StatusBadge state={primary.display_state === 'completed' ? 'done' : 'shared'}>
            {stateLabel(primary.display_state)}
          </StatusBadge>
        </div>
        <h2 id="partner-primary-role-title">오늘 내 역할</h2>
        <strong className={styles.roleName}>{primary.partner_role}</strong>
        <p>{primary.partner_action}</p>
      </Card>

      <Card as="section" className={styles.contextCard} aria-label="공유된 케어">
        <span className={styles.microLabel}>공유된 케어</span>
        <h3 id="partner-context-title">{primary.title}</h3>
        {primary.description ? <p>{primary.description}</p> : <p>내 화면에서 확인된 내용만 보여요.</p>}
      </Card>

      <Card as="section" className={styles.actionCard} aria-labelledby="partner-action-title">
        <div className={styles.sectionTitleRow}>
          <h3 id="partner-action-title">도움 행동</h3>
          <span>{items.length}개</span>
        </div>
        <div className={styles.actionStack}>
          {items.map((item) => (
            <article className={styles.actionItem} key={item.safe_id}>
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{item.partner_action}</strong>
                <small>{item.title}</small>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card as="section" className={styles.avoidCard} aria-labelledby="partner-avoid-title">
        <h3 id="partner-avoid-title">오늘 피하기</h3>
        <div className={styles.chipRow}>
          {items.map((item) => (
            <span key={item.safe_id}>{item.avoid_prompt}</span>
          ))}
        </div>
      </Card>

      {supporting.length > 0 ? (
        <section className={styles.supportingList} aria-label="다음 역할">
          {supporting.map((item) => (
            <article className={styles.supportingItem} key={item.safe_id}>
              <span>{item.partner_role}</span>
              <strong>{item.title}</strong>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function stateLabel(state: PartnerActionViewItem['display_state']) {
  if (state === 'completed') return '완료됨';
  if (state === 'revoked') return '공유 종료';
  if (state === 'superseded') return '새 내용 있음';
  if (state === 'changed_since_ack') return '바뀐 내용';
  return '현재 할 일';
}

function toneFor(cardType: PartnerActionViewItem['card_type']) {
  if (cardType === 'injection' || cardType === 'medication') return 'coral';
  if (cardType === 'clinic_visit' || cardType === 'clinic_confirmation') return 'lavender';
  return 'sage';
}
