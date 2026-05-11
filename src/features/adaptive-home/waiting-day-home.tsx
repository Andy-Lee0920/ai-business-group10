import { Badge, Card, CtaButton, Notice, classNames } from '../../components/ui';
import type { AdaptiveStateHomeBaseProps } from './types';
import styles from './waiting-day-home.module.css';

const partnerActions = [
  '결과를 묻기보다 먼저 물 한 잔을 건네기',
  '다음 일정만 함께 확인하고 오늘 이야기는 줄이기',
  '산책이나 쉬는 시간을 조용히 제안하기',
];

export function WaitingDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const visibleCards = context.cards.slice(0, 2);

  return (
    <main className={classNames('app-shell', styles.shell)}>
      <Card aria-labelledby="home-title" className={styles.hero} tone="sage">
        <p className={styles.eyebrow}>기다리는 날</p>
        <h1 className={styles.title} id="home-title">
          오늘은 천천히 확인해요
        </h1>
        <p className={styles.lead}>{context.primaryMessage}</p>

        <div className={styles.actionArea}>
          <CtaButton className={styles.primaryAction} type="button">
            차분한 체크인 시작
          </CtaButton>
          <p className={styles.actionHint}>필요한 것만 짧게 보고, 나머지는 쉬어도 괜찮아요.</p>
        </div>

        {visibleCards.length > 0 ? (
          <section aria-label="오늘 확인할 일정" className={styles.cardList}>
            {visibleCards.map((card) => (
              <article className={styles.actionCard} data-testid="home-action-card" key={card.id}>
                <Badge tone="sage">천천히</Badge>
                <h2 className={styles.cardTitle}>{card.title}</h2>
                {card.description ? <p className={styles.cardCopy}>{card.description}</p> : null}
              </article>
            ))}
          </section>
        ) : null}

        <section aria-labelledby="partner-role-title" className={styles.partnerBlock}>
          <p className={styles.sectionLabel}>오늘 파트너의 역할</p>
          <h2 className={styles.sectionTitle} id="partner-role-title">
            오늘은 곁에 있는 사람
          </h2>
          <ul className={styles.partnerActions}>
            {partnerActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>

        <Notice className={styles.notificationTone} tone="sage">
          <p className={styles.sectionLabel}>알림 톤</p>
          <p className={styles.notificationCopy}>오늘은 기다리는 날이에요. 다음 일정은 목요일입니다.</p>
        </Notice>
      </Card>
    </main>
  );
}
