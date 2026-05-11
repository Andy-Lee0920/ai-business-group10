import { computeDisplaySafetyLevel } from '../../domain/care-cards';
import type { CareActionCard, CareCardStatus, CardType } from '../../types/care-cards.types';
import type { PresentationCareActionCard } from '../../types/presentation-demo.types';
import type { AdaptiveCareDay } from './types';

const COUPLE_ID = 'presentation-couple';
const USER_ID = 'presentation-primary';

export type PresentationCareParam = 'injection' | 'clinic' | 'waiting';

export function getPresentationScenarioCards(care: PresentationCareParam, now: Date): PresentationCareActionCard[] {
  return scenarioSeeds(care, now).map((card) => ({
    ...card,
    displaySafetyLevel: computeDisplaySafetyLevel(card, now),
  }));
}

export function normalizePresentationCare(value: string | string[] | null | undefined): PresentationCareParam {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'clinic') return 'clinic';
  if (raw === 'waiting') return 'waiting';
  return 'injection';
}

export function toAdaptiveCareDay(care: PresentationCareParam): AdaptiveCareDay {
  if (care === 'clinic') return 'clinic_day';
  if (care === 'waiting') return 'waiting_day';
  return 'injection_day';
}

function scenarioSeeds(care: PresentationCareParam, now: Date): CareActionCard[] {
  if (care === 'clinic') return clinicDaySeeds(now);
  if (care === 'waiting') return waitingDaySeeds(now);
  return injectionDaySeeds(now);
}

function injectionDaySeeds(now: Date): CareActionCard[] {
  return [
    makeCard('injection-gonal', 'injection', '21:00 고날에프 — 내가 확인한 용량', minutesFrom(now, 20), '주사 30분 전 손 씻기와 펜, 알코올솜을 조용히 확인해요.', 'confirmed'),
    makeCard('injection-ovitrelle', 'injection', '22:00 오비드렐 트리거 확인', minutesFrom(now, 80), '골든타임은 내가 확인한 시간만 기준으로 보여줘요.', 'confirmed'),
    makeCard('injection-partner', 'partner_support', '파트너 역할: 준비물과 공간 맡기', minutesFrom(now, 10), '질문을 늘리지 않고 알코올솜, 폐기통, 조용한 공간을 먼저 챙겨요.', 'confirmed'),
    makeCard('injection-medication', 'medication', '프로게스테론 복용 — 병원 안내대로', minutesFrom(now, 180), '용량 판단 없이 내가 확인한 복용 시간만 남겨요.', 'confirmed'),
  ];
}

function clinicDaySeeds(now: Date): CareActionCard[] {
  return [
    makeCard('clinic-visit', 'clinic_visit', '오늘 오전 병원 방문', minutesFrom(now, 60), '채혈과 초음파 확인 예정', 'confirmed'),
    makeCard('clinic-result-note', 'clinic_confirmation', '결과와 다음 방문일 함께 기록', minutesFrom(now, 90), '의사 설명을 한 문장씩 확인해요', 'confirmed'),
    makeCard('clinic-partner', 'partner_support', '파트너가 이동과 기록 돕기', minutesFrom(now, 30), '이동 시간과 결과 메모를 함께 챙겨요', 'confirmed'),
  ];
}

function waitingDaySeeds(now: Date): CareActionCard[] {
  return [
    makeCard('waiting-next-visit', 'clinic_visit', '목요일 오전 9시 다음 확인', daysFrom(now, 2), '오늘은 기다리는 날이에요. 다음 일정만 조용히 확인해요', 'confirmed'),
    makeCard('waiting-partner', 'partner_support', '파트너는 결과를 재촉하지 않기', daysFrom(now, 2), '오늘 필요한 행동은 조용히 곁에 있어 주는 것', 'confirmed'),
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
    source_text: `발표 메모: ${title}`,
    scheduled_at: scheduledAt,
    care_date: scheduledAt.slice(0, 10),
    status,
    confirmation_required: cardType === 'injection' || cardType === 'clinic_confirmation',
    user_marked_important: cardType === 'injection',
    partner_visible: true,
    revision: 1,
  };
}

function minutesFrom(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function daysFrom(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60_000).toISOString();
}
