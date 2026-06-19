import { computeCareSurface } from '../../domain/care-surface-engine';
import { computeHomeContext, type HomeContext } from '../../domain/home-composition';
import { AdaptiveHomeRuntime } from '../adaptive-home/adaptive-home-runtime';
import {
  getPresentationScenarioCards,
  normalizePresentationCare,
  toAdaptiveCareDay,
  type PresentationCareParam,
} from '../adaptive-home/presentation-scenarios';
import type { AdaptiveCareDay } from '../adaptive-home/types';

export const DEFAULT_ADAPTIVE_HOME_CARE: PresentationCareParam = 'clinic';

const PRIMARY_MESSAGES: Record<AdaptiveCareDay, string> = {
  injection_day: '오늘은 주사 시간과 준비물이 흔들리지 않도록, 확인한 내용만 먼저 놓을게요.',
  clinic_day: '방문 전에는 지난 흐름과 다음 안내를 한 번에 차분히 확인해요.',
  waiting_day: '오늘은 더 많이 확인하기보다, 필요한 일정만 조용히 붙잡아 둘게요.',
  two_week_wait_day: '피검 전까지는 기록은 남기고 판단은 잠시 미뤄둘게요.',
  result_protection_day: '오늘은 아무것도 결정하지 않아도 됩니다. 필요한 알림만 조용히 남겨둘게요.',
};

export type AdaptiveHomeDemoParams = Record<string, string | string[] | undefined> | undefined;

export function hasAdaptiveHomeDemoParam(params: AdaptiveHomeDemoParams) {
  return Boolean(params?.care ?? params?.careDay ?? params?.demoCareDay);
}

export function getAdaptiveHomeDemoCare(params: AdaptiveHomeDemoParams, fallback = DEFAULT_ADAPTIVE_HOME_CARE) {
  return normalizePresentationCare(params?.care ?? params?.careDay ?? params?.demoCareDay ?? fallback);
}

export function buildAdaptiveHomeDemoState(care: PresentationCareParam, now = new Date()) {
  const cards = getPresentationScenarioCards(care, now);
  const careDay = toAdaptiveCareDay(care);
  const baseContext = computeHomeContext(cards, now);
  const context: HomeContext = {
    ...baseContext,
    careDay,
    phaseCareDay: careDay,
    surfaceCareDay: careDay,
    overrideReason: 'none',
    primaryMessage: PRIMARY_MESSAGES[careDay],
    partnerConnected: true,
  };
  const composition = computeCareSurface({
    careDay,
    overrideReason: 'none',
    cardCount: context.cards.length,
    partnerStatus: 'seen',
  });

  return { context, composition };
}

export function AdaptiveHomeDemo({ care, now = new Date() }: { care: PresentationCareParam; now?: Date }) {
  const { context, composition } = buildAdaptiveHomeDemoState(care, now);
  return <AdaptiveHomeRuntime context={context} composition={composition} demoMode />;
}
