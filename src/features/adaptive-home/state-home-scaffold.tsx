import { Badge, Card } from '../../components/ui';
import { HomeUtilityLauncher } from './home-utility-launcher';
import type { AdaptiveStateHomeBaseProps } from './types';

export function StateHomeScaffold({
  eyebrow,
  title,
  context,
  badge,
}: {
  eyebrow: string;
  title: string;
  context: AdaptiveStateHomeBaseProps['context'];
  badge: string;
}) {
  return (
    <main className="app-shell">
      <Card aria-labelledby="home-title" className="hero-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="home-title">{title}</h1>
        <p className="lead">{context.primaryMessage}</p>
        <div className="adaptive-home-list" aria-label="오늘 카드 목록">
          {context.cards.map((card) => (
            <article className="adaptive-home-card" data-testid="home-action-card" key={card.id}>
              <Badge tone={card.displaySafetyLevel === 'critical' ? 'coral' : 'sage'}>{badge}</Badge>
              <h2>{card.title}</h2>
              {card.urgencyCopy ? <p className="adaptive-home-urgency">{card.urgencyCopy}</p> : null}
              {card.description ? <p className="lead">{card.description}</p> : null}
            </article>
          ))}
        </div>
        <HomeUtilityLauncher />
      </Card>
    </main>
  );
}
