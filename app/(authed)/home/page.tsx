import { headers } from 'next/headers';
import { Badge, Card } from '../../../src/components/ui';
import { isPresentationHost, isPresentationMode } from '../../../src/config';
import { computeDisplaySafetyLevel } from '../../../src/domain/care-cards';
import { computeHomeContext, type HomeActionCard } from '../../../src/domain/home-composition';
import { getPresentationCards } from '../../../src/lib/presentation-demo-data';
import styles from './home.module.css';
import type { CareActionCard, DisplaySafetyLevel } from '../../../src/types/care-cards.types';

export const dynamic = 'force-dynamic';

type RenderableHomeCard = HomeActionCard & { status: CareActionCard['status'] };

export default async function DynamicHomePage() {
  const now = new Date();
  const requestHeaders = await headers();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));
  const cards = presentationMode ? getPresentationCards(now) : makeDemoCards(now);
  const context = computeHomeContext(cards, now);
  const renderedCards = presentationMode ? toPresentationHomeCards(cards, now) : withConfirmedStatus(context.cards);

  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className="hero-card">
        <p className="eyebrow">{presentationMode ? '발표 데모' : 'Dynamic Home'}</p>
        <h1 id="home-title">오늘의 실행 카드</h1>
        <p className="lead">{context.primaryMessage}</p>
        <div className={styles.homeCardList} aria-label="오늘 카드 목록">
          {renderedCards.map((card) => (
            <article className={`${styles.homeActionCard} ${card.displaySafetyLevel === 'critical' ? styles.homeCardCoral : ''}`} data-testid="home-action-card" key={card.id}>
              <Badge tone={badgeTone(card.displaySafetyLevel, card.status)}>{badgeLabel(card.displaySafetyLevel, card.status)}</Badge>
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

function toPresentationHomeCards(cards: readonly CareActionCard[], now: Date): RenderableHomeCard[] {
  return cards.map((card) => toRenderableCard(card, now)).sort(compareRenderableCards);
}

function toRenderableCard(card: CareActionCard, now: Date): RenderableHomeCard {
  const displaySafetyLevel = computeDisplaySafetyLevel(card, now);
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    scheduledAt: card.scheduled_at,
    displaySafetyLevel,
    accentClassName: displaySafetyLevel === 'critical' ? 'home-card--critical home-card--coral' : 'home-card--calm',
    urgencyCopy: displaySafetyLevel === 'critical' ? '시간 다 됐어요 · 지금 ±30분' : null,
    status: card.status,
  };
}

function withConfirmedStatus(cards: readonly HomeActionCard[]): RenderableHomeCard[] {
  return cards.map((card) => ({ ...card, status: 'confirmed' }));
}

function compareRenderableCards(left: RenderableHomeCard, right: RenderableHomeCard) {
  const levelDelta = safetyRank(right.displaySafetyLevel) - safetyRank(left.displaySafetyLevel);
  if (levelDelta !== 0) return levelDelta;
  return timeRank(left.scheduledAt) - timeRank(right.scheduledAt);
}

function safetyRank(level: DisplaySafetyLevel) {
  if (level === 'critical') return 2;
  if (level === 'time_sensitive') return 1;
  return 0;
}

function timeRank(value: string | null) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function badgeTone(level: DisplaySafetyLevel, status: CareActionCard['status']) {
  if (status === 'completed') return 'lavender';
  return level === 'critical' ? 'coral' : 'sage';
}

function badgeLabel(level: DisplaySafetyLevel, status: CareActionCard['status']) {
  if (status === 'completed') return '완료';
  return level === 'critical' ? '임박' : '확정';
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
