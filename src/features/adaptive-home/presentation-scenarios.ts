import { computeDisplaySafetyLevel } from '../../domain/care-cards';
import { serializePartnerViewCards } from '../../services/partner-view';
import type { CareActionCard, CareCardStatus, CardType } from '../../types/care-cards.types';
import type { PresentationCareActionCard } from '../../types/presentation-demo.types';
import type { PartnerActionViewItem } from '../../types/partner-view.types';
import type { AdaptiveCareDay } from './types';

const COUPLE_ID = 'presentation-couple';
const USER_ID = 'presentation-primary';

export type PresentationCareParam = 'injection' | 'clinic' | 'waiting' | 'two_week_wait_day' | 'result_protection_day';

export function getPresentationScenarioCards(care: PresentationCareParam, now: Date): PresentationCareActionCard[] {
  return scenarioSeeds(care, now).map((card) => ({
    ...card,
    displaySafetyLevel: computeDisplaySafetyLevel(card, now),
  }));
}

export function getPresentationCards(now: Date): PresentationCareActionCard[] {
  return getPresentationScenarioCards('injection', now);
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

export function normalizePresentationCare(value: string | string[] | null | undefined): PresentationCareParam {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'clinic') return 'clinic';
  if (raw === 'waiting') return 'waiting';
  if (raw === 'two_week_wait_day') return 'two_week_wait_day';
  if (raw === 'result_protection_day') return 'result_protection_day';
  return 'injection';
}

export function toAdaptiveCareDay(care: PresentationCareParam): AdaptiveCareDay {
  if (care === 'clinic') return 'clinic_day';
  if (care === 'waiting') return 'waiting_day';
  if (care === 'two_week_wait_day') return 'two_week_wait_day';
  if (care === 'result_protection_day') return 'result_protection_day';
  return 'injection_day';
}

function scenarioSeeds(care: PresentationCareParam, now: Date): CareActionCard[] {
  if (care === 'clinic') return clinicDaySeeds(now);
  if (care === 'waiting') return waitingDaySeeds(now);
  if (care === 'two_week_wait_day') return twoWeekWaitSeeds(now);
  if (care === 'result_protection_day') return resultProtectionSeeds(now);
  return injectionDaySeeds(now);
}

function injectionDaySeeds(now: Date): CareActionCard[] {
  return [
    makeCard('injection-gonal', 'injection', '21:00 고날에프 — 내가 확인한 용량', minutesFrom(now, 20), '주사 30분 전 손 씻기와 펜, 알코올솜을 조용히 확인해요.', 'confirmed', todayUtc(now)),
    makeCard('injection-ovitrelle', 'injection', '22:00 오비드렐 트리거 확인', minutesFrom(now, 80), '골든타임은 내가 확인한 시간만 기준으로 보여줘요.', 'confirmed', todayUtc(now)),
    makeCard('injection-partner', 'partner_support', '파트너 역할: 준비물과 공간 맡기', minutesFrom(now, 10), '질문을 늘리지 않고 알코올솜, 폐기통, 조용한 공간을 먼저 챙겨요.', 'confirmed', todayUtc(now)),
    makeCard('injection-medication', 'medication', '프로게스테론 복용 — 병원 안내대로', minutesFrom(now, 180), '용량 판단 없이 내가 확인한 복용 시간만 남겨요.', 'confirmed', todayUtc(now)),
    makeCard('injection-partner-done', 'partner_support', '파트너 주사 준비 역할 완료', minutesFrom(now, -90), '필요한 준비물을 묻기 전에 먼저 확인했어요.', 'completed', todayUtc(now)),
  ];
}

function clinicDaySeeds(now: Date): CareActionCard[] {
  return [
    makeCard('clinic-visit', 'clinic_visit', '오늘 오전 병원 방문', minutesFrom(now, 60), '채혈과 초음파 확인 예정', 'confirmed', todayUtc(now)),
    makeCard('clinic-result-note', 'clinic_confirmation', '결과와 다음 방문일 함께 기록', minutesFrom(now, 90), '진료 후 안내를 한 문장씩 확인해요', 'confirmed', todayUtc(now)),
    makeCard('clinic-partner', 'partner_support', '파트너가 이동과 기록 돕기', minutesFrom(now, 30), '이동 시간과 결과 메모를 함께 챙겨요', 'confirmed', todayUtc(now)),
  ];
}

function waitingDaySeeds(now: Date): CareActionCard[] {
  return [
    makeCard('waiting-next-visit', 'clinic_visit', '목요일 오전 9시 다음 확인', daysFrom(now, 2), '오늘은 기다리는 날이에요. 다음 일정만 조용히 확인해요', 'confirmed'),
    makeCard('waiting-partner', 'partner_support', '파트너는 결과를 재촉하지 않기', daysFrom(now, 2), '오늘 필요한 행동은 조용히 곁에 있어 주는 것', 'confirmed'),
  ];
}


function twoWeekWaitSeeds(now: Date): CareActionCard[] {
  return [
    makeCard('two-ww-anchor', 'general_action', 'D+5 피검까지 남은 날 확인', daysFrom(now, 5), '오늘 할 수 있는 일의 경계만 짧게 확인해요.', 'confirmed'),
    makeCard('two-ww-medication', 'medication', '프로게스테론 22:00 루틴', minutesFrom(now, 120), '반복 약은 병원 안내 시간만 기준으로 보여줘요.', 'confirmed', todayUtc(now)),
    makeCard('two-ww-partner', 'partner_support', '파트너 역할: 먼저 묻지 않고 곁에 있기', daysFrom(now, 1), '검색이나 해석 대신 오늘 컨디션과 휴식만 확인해요.', 'confirmed'),
  ];
}

function resultProtectionSeeds(now: Date): CareActionCard[] {
  return [
    makeCard('result-visibility', 'general_action', '결과 공유 범위 선택', minutesFrom(now, 5), '다음 일정만 또는 결과까지 사용자가 직접 고릅니다.', 'confirmed', todayUtc(now)),
    makeCard('result-next-step', 'clinic_visit', '다음 검사일 확인', daysFrom(now, 2), '수치 해석 없이 다음 병원 일정만 남겨요.', 'confirmed'),
    makeCard('result-partner', 'partner_support', '파트너 역할: 먼저 단정하지 않기', minutesFrom(now, 15), '결과를 해석하지 않고 사용자의 공유 범위를 존중해요.', 'confirmed', todayUtc(now)),
  ];
}

function makeCard(
  id: string,
  cardType: CardType,
  title: string,
  scheduledAt: string,
  description: string,
  status: CareCardStatus,
  careDate = scheduledAt.slice(0, 10),
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
    care_date: careDate,
    status,
    confirmation_required: cardType === 'injection' || cardType === 'clinic_confirmation',
    user_marked_important: cardType === 'injection',
    partner_visible: true,
    revision: 1,
  };
}

function todayUtc(now: Date) {
  return now.toISOString().slice(0, 10);
}

function minutesFrom(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function daysFrom(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60_000).toISOString();
}
