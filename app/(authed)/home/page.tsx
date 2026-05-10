import { Badge, Card } from '../../../src/components/ui';
import { computeHomeContext } from '../../../src/domain/home-composition';
import styles from './home.module.css';
import type { CareActionCard } from '../../../src/types/care-cards.types';

export const dynamic = 'force-dynamic';

export default function DynamicHomePage() {
  const now = new Date();
  const context = computeHomeContext(makeDemoCards(now), now);

  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className="hero-card">
        <p className="eyebrow">Dynamic Home</p>
        <h1 id="home-title">오늘의 실행 카드</h1>
        <p className="lead">{context.primaryMessage}</p>
        <div className={styles.homeCardList} aria-label="오늘 카드 목록">
          {context.cards.map((card) => (
            <article className={`${styles.homeActionCard} ${card.displaySafetyLevel === 'critical' ? styles.homeCardCoral : ''}`} data-testid="home-action-card" key={card.id}>
              <Badge tone={card.displaySafetyLevel === 'critical' ? 'coral' : 'sage'}>
                {card.displaySafetyLevel === 'critical' ? '임박' : '확정'}
              </Badge>
              <h2>{card.title}</h2>
              {card.urgencyCopy ? <p className={styles.homeUrgencyCopy}>{card.urgencyCopy}</p> : null}
              {card.description ? <p className="lead">{card.description}</p> : null}
            </article>
          ))}
        </div>
      </Card>
    </main>
  );
}

function makeDemoCards(now: Date): CareActionCard[] {
  const imminent = new Date(now.getTime() + 20 * 60_000).toISOString();
  const later = new Date(now.getTime() + 3 * 60 * 60_000).toISOString();
  return [
    makeCard('routine', 'medication', '프로게스테론 복용', later),
    makeCard('injection', 'injection', '오늘 21시 고날에프 1회', imminent),
  ];
}

function makeCard(id: string, cardType: CareActionCard['card_type'], title: string, scheduledAt: string): CareActionCard {
  return {
    id,
    couple_id: 'demo-couple',
    created_by: 'demo-user',
    assignee_role: 'primary_user',
    card_type: cardType,
    title,
    description: null,
    source_text: title,
    scheduled_at: scheduledAt,
    care_date: null,
    status: 'confirmed',
    confirmation_required: false,
    user_marked_important: false,
    partner_visible: true,
    revision: 1,
  };
}
