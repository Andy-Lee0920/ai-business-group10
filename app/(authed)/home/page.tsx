import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { Badge, Card } from '../../../src/components/ui';
import { isPresentationHost, isPresentationMode } from '../../../src/config';
import { computeHomeContext, type HomeActionCard } from '../../../src/domain/home-composition';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { AdaptiveHomeRuntime } from '../../../src/features/adaptive-home/adaptive-home-runtime';
import { getPresentationScenarioCards, normalizePresentationCare } from '../../../src/features/adaptive-home/presentation-scenarios';
import styles from './home.module.css';
import type { CareActionCard, DisplaySafetyLevel } from '../../../src/types/care-cards.types';

export const dynamic = 'force-dynamic';

type RenderableHomeCard = HomeActionCard & { status: CareActionCard['status'] };

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DynamicHomePage({ searchParams }: HomePageProps) {
  const now = new Date();
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const presentationMode = isPresentationMode() || isPresentationHost(requestHeaders.get('host'));
  const query = await searchParams;
  const presentationCare = normalizePresentationCare(query?.care);
  const onboardingCard = presentationMode ? readOnboardingCard(cookieStore.get('fevio_onboarding_first_card')?.value) : null;
  const persistedCards = presentationMode || onboardingCard ? [] : await getPersistedCards();
  const cards = onboardingCard
    ? [onboardingCard]
    : presentationMode
      ? getPresentationScenarioCards(presentationCare, now)
      : persistedCards.length > 0
        ? persistedCards
        : makeDemoCards(now);
  const context = computeHomeContext(cards, now);

  if (presentationMode) return <AdaptiveHomeRuntime context={context} demoMode />;

  const renderedCards = withConfirmedStatus(context.cards);

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
        <section className={styles.utilityLauncher} aria-labelledby="utility-launcher-title">
          <div className={styles.utilityHeader}>
            <p className="eyebrow">Low-energy input</p>
            <h2 id="utility-launcher-title">바로 정리하기</h2>
            <p>
              처음부터 길게 쓰지 않아도 괜찮아요. 지금 필요한 하나만 넣으면 오늘 화면과 공유 상태가
              같이 정리됩니다.
            </p>
          </div>
          <div className={styles.utilityGrid}>
            <Link className={styles.utilityLink} href="/schedule">
              <span>01</span>
              <strong>일정 등록·변경</strong>
              <small>방문·검사·취소를 오늘 실행 카드로 연결</small>
            </Link>
            <Link className={styles.utilityLink} href="/medication">
              <span>02</span>
              <strong>약·주사 추가</strong>
              <small>이름·용량·시간을 직접 확인하고 완료 체크</small>
            </Link>
            <Link className={styles.utilityLink} href="/capture">
              <span>03</span>
              <strong>병원 메모 정리</strong>
              <small>들은 내용을 확정 전 카드로 나누기</small>
            </Link>
          </div>
          <div className={styles.sharedProjection} aria-label="파트너 공유 상태">
            <span>공유 상태</span>
            <strong>내가 확정한 카드만 파트너 화면에 안전하게 보입니다.</strong>
            <p>아직 파트너가 직접 바꾸지는 않습니다. v1.0은 한쪽에서 정리한 내용을 놓치지 않게 보여주는 단계입니다.</p>
          </div>
        </section>
      </Card>
    </main>
  );
}

async function getPersistedCards(): Promise<CareActionCard[]> {
  try {
    const supabase = await createCookieBackedSupabaseClient();
    const { data, error } = await supabase
      .from('care_action_cards')
      .select('id,couple_id,created_by,assignee_role,card_type,title,description,source_text,scheduled_at,care_date,status,confirmation_required,user_marked_important,partner_visible,revision')
      .eq('status', 'confirmed')
      .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (error || !Array.isArray(data)) return [];
    return data.filter(isCareActionCard);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing Supabase public config')) return [];
    throw error;
  }
}

function isCareActionCard(value: unknown): value is CareActionCard {
  if (typeof value !== 'object' || value === null) return false;
  const card = value as Partial<CareActionCard>;
  return (
    typeof card.id === 'string' &&
    typeof card.couple_id === 'string' &&
    typeof card.created_by === 'string' &&
    (card.assignee_role === 'primary_user' || card.assignee_role === 'partner' || card.assignee_role === 'both') &&
    isCardType(card.card_type) &&
    typeof card.title === 'string' &&
    (typeof card.description === 'string' || card.description === null) &&
    typeof card.source_text === 'string' &&
    (typeof card.scheduled_at === 'string' || card.scheduled_at === null) &&
    (typeof card.care_date === 'string' || card.care_date === null) &&
    card.status === 'confirmed' &&
    typeof card.confirmation_required === 'boolean' &&
    typeof card.user_marked_important === 'boolean' &&
    typeof card.partner_visible === 'boolean' &&
    typeof card.revision === 'number'
  );
}

function isCardType(value: unknown): value is CareActionCard['card_type'] {
  return (
    value === 'injection' ||
    value === 'medication' ||
    value === 'clinic_visit' ||
    value === 'clinic_confirmation' ||
    value === 'partner_support' ||
    value === 'record' ||
    value === 'general_action'
  );
}

function readOnboardingCard(value: string | undefined): CareActionCard | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CareActionCard>;
    if (typeof parsed.id !== 'string' || typeof parsed.title !== 'string' || typeof parsed.source_text !== 'string') return null;
    if (parsed.status !== 'confirmed' || !isCardType(parsed.card_type)) return null;
    return {
      id: parsed.id,
      couple_id: typeof parsed.couple_id === 'string' ? parsed.couple_id : 'onboarding-couple',
      created_by: typeof parsed.created_by === 'string' ? parsed.created_by : 'onboarding',
      assignee_role: parsed.assignee_role === 'partner' || parsed.assignee_role === 'both' ? parsed.assignee_role : 'primary_user',
      card_type: parsed.card_type,
      title: parsed.title,
      description: typeof parsed.description === 'string' ? parsed.description : null,
      source_text: parsed.source_text,
      scheduled_at: typeof parsed.scheduled_at === 'string' ? parsed.scheduled_at : null,
      care_date: typeof parsed.care_date === 'string' ? parsed.care_date : null,
      status: 'confirmed',
      confirmation_required: parsed.confirmation_required === true,
      user_marked_important: parsed.user_marked_important === true,
      partner_visible: parsed.partner_visible === true,
      revision: typeof parsed.revision === 'number' ? parsed.revision : 1,
    };
  } catch {
    return null;
  }
}

function withConfirmedStatus(cards: readonly HomeActionCard[]): RenderableHomeCard[] {
  return cards.map((card) => ({ ...card, status: 'confirmed' }));
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
