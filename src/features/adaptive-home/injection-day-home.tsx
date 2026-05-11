import { Badge, Card, CtaButton, Notice, classNames } from '../../components/ui';
import { HomeUtilityLauncher } from './home-utility-launcher';
import type { AdaptiveStateHomeBaseProps } from './types';
import styles from './injection-day-home.module.css';

export function InjectionDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const primaryCardId = context.cards[0]?.id ?? null;

  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className={classNames('hero-card', styles.screen)}>
        <p className="eyebrow">오늘의 주사 준비</p>
        <h1 id="home-title" className={styles.title}>
          주사 시간부터 함께 확인해요
        </h1>
        <p className="lead">{context.primaryMessage}</p>

        <section className={styles.careSurface} aria-label="오늘 주사 케어 요약">
          <div>
            <span className={styles.blockLabel}>오늘 우선순위</span>
            <strong>확정된 주사 카드 먼저</strong>
            <p>확정된 카드 {context.cards.length}개만 홈과 파트너 공유에 사용해요.</p>
          </div>
          <div className={styles.careOrb} aria-hidden="true">
            <span>✓</span>
          </div>
        </section>

        <Notice tone="coral" className={styles.notificationBlock} aria-label="알림 문구 예시">
          <span className={styles.blockLabel}>알림은 이렇게 전해져요</span>
          <p>30분 뒤 주사 시간이에요. 준비물을 함께 확인해요.</p>
        </Notice>

        <div className={styles.cardList} aria-label="오늘 카드 목록">
          {context.cards.map((card) => {
            const isPrimary = card.id === primaryCardId || card.displaySafetyLevel === 'critical';

            return (
              <article
                className={classNames(styles.actionCard, isPrimary && styles.actionCardPriority)}
                data-testid="home-action-card"
                key={card.id}
              >
                <div className={styles.cardHeader}>
                  <Badge tone={card.displaySafetyLevel === 'critical' ? 'coral' : 'sage'}>
                    {card.displaySafetyLevel === 'critical' ? '먼저 확인' : '다음 확인'}
                  </Badge>
                  {isPrimary ? <span className={styles.priorityText}>주사 준비 우선</span> : null}
                </div>
                <h2>{card.title}</h2>
                {card.urgencyCopy ? <p className={styles.urgencyCopy}>{card.urgencyCopy}</p> : null}
                {card.description ? <p className="lead">{card.description}</p> : null}
              </article>
            );
          })}
        </div>

        <div className={styles.ctaRow}>
          <CtaButton type="button" className={styles.primaryAction}>
            주사 준비 체크 시작
          </CtaButton>
        </div>

        <section className={styles.partnerBlock} aria-labelledby="partner-role-title">
          <span className={styles.blockLabel}>오늘 파트너의 역할</span>
          <h2 id="partner-role-title">오늘은 확인자</h2>
          <ul>
            <li>주사 시간 30분 전에 준비물과 손 씻기를 같이 확인해요.</li>
            <li>약 이름과 투여 시간을 카드와 다시 맞춰봐요.</li>
            <li>끝난 뒤에는 사용한 물품을 정리하고 다음 알림을 확인해요.</li>
          </ul>
        </section>
        <HomeUtilityLauncher />
      </Card>
    </main>
  );
}
