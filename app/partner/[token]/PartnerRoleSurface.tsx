import { Badge, Card, StatusBadge } from '../../../src/components/ui';
import { PartnerAvatar } from '../../../src/design/couple-avatars';
import type { PartnerSurfaceSignal } from '../../../src/types/care-surface.types';
import type { PartnerActionViewItem } from '../../../src/types/partner-view.types';
import { formatKstTime } from '../../../src/domain/kst-date';
import styles from './partner-role-surface.module.css';

export function PartnerRoleSurface({
  items,
  live = false,
  signal,
  onAssist,
  assistedIds,
  assistingIds,
}: {
  items: PartnerActionViewItem[];
  live?: boolean;
  signal?: PartnerSurfaceSignal;
  onAssist?: (item: PartnerActionViewItem) => void;
  assistedIds?: ReadonlySet<string>;
  assistingIds?: ReadonlySet<string>;
}) {
  if (items.length === 0) return <p className="notice">지금 공유된 파트너 할 일이 없어요.</p>;

  const orderedItems = [...items].sort((left, right) => Number(canRecordAssist(right)) - Number(canRecordAssist(left)));
  const primary = orderedItems[0] ?? items[0];
  const supporting = orderedItems.filter((item) => item.safe_id !== primary.safe_id);

  return (
    <section className={styles.surface} aria-label="파트너 역할 카드" aria-live={live ? 'polite' : undefined} style={signal ? ({ '--fevio-surface-intensity': signal.intensity } as React.CSSProperties) : undefined} data-urgency-tier={signal?.urgencyTier} data-intensity={signal?.intensity.toFixed(2)}>
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
        {signal ? <p className={styles.signalCopy} data-testid="partner-surface-signal">{signal.momentCopy}</p> : null}
        <h2 id="partner-primary-role-title">오늘 도와줄 일</h2>
        <strong className={styles.roleName}>{formatPrimaryLine(primary)}</strong>
        <p>{primary.partner_action || primary.description || '내 화면에서 확인된 내용만 보여요.'}</p>
        {onAssist && canRecordAssist(primary) ? (
          <button
            className={styles.assistButton}
            disabled={assistedIds?.has(primary.safe_id) || assistingIds?.has(primary.safe_id)}
            onClick={() => onAssist(primary)}
            type="button"
          >
            {assistedIds?.has(primary.safe_id) ? '도움 기록됨' : assistingIds?.has(primary.safe_id) ? '기록 중' : '도움 완료'}
          </button>
        ) : null}
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
          {supporting.map((item) => (
            <article className={styles.actionItem} key={item.safe_id}>
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{item.partner_action}</strong>
                <small>{item.title}</small>
                {onAssist && canRecordAssist(item) ? (
                  <button
                    className={styles.assistButton}
                    disabled={assistedIds?.has(item.safe_id) || assistingIds?.has(item.safe_id)}
                    onClick={() => onAssist(item)}
                    type="button"
                  >
                    {assistedIds?.has(item.safe_id) ? '도움 기록됨' : assistingIds?.has(item.safe_id) ? '기록 중' : '도움 완료'}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card as="section" className={styles.avoidCard} aria-labelledby="partner-avoid-title">
        <h3 id="partner-avoid-title">오늘 피하기</h3>
        <div className={styles.chipRow}>
          {orderedItems.map((item) => (
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

function canRecordAssist(item: PartnerActionViewItem) {
  return item.partner_action.trim().length > 0 && item.display_state !== 'completed';
}

function formatPrimaryLine(item: PartnerActionViewItem) {
  const time = item.scheduled_at ? formatKstTime(item.scheduled_at) : '오늘';
  return `${time} · ${item.title}`;
}
