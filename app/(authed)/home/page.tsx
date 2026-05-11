import { cookies, headers } from 'next/headers';
import { isPresentationHost, isPresentationMode } from '../../../src/config';
import { computeHomeContext } from '../../../src/domain/home-composition';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { AdaptiveHomeRuntime } from '../../../src/features/adaptive-home/adaptive-home-runtime';
import { getPresentationScenarioCards, normalizePresentationCare } from '../../../src/features/adaptive-home/presentation-scenarios';
import type { CareActionCard } from '../../../src/types/care-cards.types';

export const dynamic = 'force-dynamic';

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

  return <AdaptiveHomeRuntime context={context} demoMode={presentationMode} />;
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

function makeDemoCards(now: Date): CareActionCard[] {
  const imminent = new Date(now.getTime() + 20 * 60_000).toISOString();
  const later = new Date(now.getTime() + 3 * 60 * 60_000).toISOString();
  return [
    makeCard('routine', 'medication', '프로게스테론 복용', later),
    makeCard('injection', 'injection', '21:00 고날에프 — 내가 확인한 용량', imminent),
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
