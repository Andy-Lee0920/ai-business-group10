import { computeDisplaySafetyLevel } from '../domain/care-cards';
import { serializePartnerViewCards } from '../services/partner-view';
import type { CareActionCard, CareCardStatus, CardType } from '../types/care-cards.types';
import type { PartnerActionViewItem } from '../types/partner-view.types';
import type { PresentationCareActionCard } from '../types/presentation-demo.types';

const COUPLE_ID = 'presentation-couple';
const USER_ID = 'presentation-primary';

export function getPresentationCards(now: Date): PresentationCareActionCard[] {
  return cardSeeds(now).map((card) => ({
    ...card,
    displaySafetyLevel: computeDisplaySafetyLevel(card, now),
  }));
}

export function getPresentationClinicMemo(): string {
  return [
    '21:00 고날에프 — 내가 확인한 용량',
    '22:00 오비드렐 트리거 확인, 냉장 보관 후 준비',
    '내일부터 프로게스테론 아침·저녁 복용',
    '목요일 오전 9시 병원 방문, 채혈과 초음파 확인',
    '파트너는 주사 30분 전 펜, 알코올솜, 조용한 공간만 함께 확인',
  ].join('\n');
}

export function getPresentationPartnerView(): PartnerActionViewItem[] {
  return serializePartnerViewCards(getPresentationCards(new Date('2026-05-11T12:00:00.000Z')));
}

function cardSeeds(now: Date): CareActionCard[] {
  return [
    makeCard('critical-gonal', 'injection', '21:00 고날에프 — 내가 확인한 용량', minutesFrom(now, 20), '주사 30분 전 펜, 알코올솜, 조용한 공간을 함께 확인해요.', 'confirmed'),
    makeCard('critical-ovitrelle', 'injection', '22:00 오비드렐 트리거 확인', minutesFrom(now, 25), '냉장 보관한 주사를 꺼내고 투여 시간을 다시 확인해요.', 'confirmed'),
    makeCard('routine-progesterone', 'medication', '프로게스테론 아침·저녁 복용', hoursFrom(now, 3), '복용 시간을 놓치지 않도록 알람 설정', 'confirmed'),
    makeCard('routine-clinic', 'clinic_visit', '목요일 오전 9시 병원 방문', daysFrom(now, 2), '채혈과 초음파 확인 예정', 'confirmed'),
    makeCard('completed-partner', 'partner_support', '파트너 주사 준비 역할 완료', minutesFrom(now, -90), '필요한 준비물을 묻기 전에 먼저 확인했어요.', 'completed'),
  ];
}

function makeCard(
  id: string,
  cardType: CardType,
  title: string,
  scheduledAt: string,
  description: string,
  status: CareCardStatus,
): CareActionCard {
  return {
    id,
    couple_id: COUPLE_ID,
    created_by: USER_ID,
    assignee_role: cardType === 'partner_support' ? 'partner' : 'primary_user',
    card_type: cardType,
    title,
    description,
    source_text: `원문 메모: ${title}`,
    scheduled_at: scheduledAt,
    care_date: scheduledAt.slice(0, 10),
    status,
    confirmation_required: cardType === 'injection',
    user_marked_important: cardType === 'injection',
    partner_visible: true,
    revision: 1,
  };
}

function minutesFrom(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function hoursFrom(now: Date, hours: number) {
  return minutesFrom(now, hours * 60);
}

function daysFrom(now: Date, days: number) {
  return hoursFrom(now, days * 24);
}
