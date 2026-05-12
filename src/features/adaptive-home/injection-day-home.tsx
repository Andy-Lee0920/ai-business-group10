import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CarePhaseStrip,
  CareMomentRing,
  CareSurfaceFrame,
  CompactHeroGreeting,
  MissionCardPair,
  PartnerConnectBar,
  QuickStatRow,
} from './care-surface-primitives';
import { countPartnerActionSignals, findPrimaryCareCard, toMissionCardData } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

const KNOWN_DRUGS = ['고날에프', '프리날', '루프론', '세트로타이드', '오비드렐', '유트로게스탄', 'HMG', '퓨리곤'];

export function InjectionDayHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const primary = findPrimaryCareCard(context.cards, '고날에프');
  const secondary = context.cards.find((c) => c !== primary) ?? null;
  const sharedCount = countPartnerActionSignals(context.cards);

  const primaryMission = primary
    ? { ...toMissionCardData(primary), cta: '준비 체크리스트 보기' }
    : null;
  const secondaryMission = secondary ? toMissionCardData(secondary) : null;

  const primaryTime = primary ? toMissionCardData(primary).time : '--:--';
  const drugName = primary ? extractDrug(primary.title) : '확인 필요';

  const stats = [
    { label: '주사 시간', value: primaryTime },
    { label: '약 종류', value: drugName },
    { label: '케어 단계', value: '주사' },
    { label: '파트너', value: sharedCount > 0 ? `${sharedCount}개 공유` : '준비 중' },
  ] as const;

  const showRingHero = composition?.slots.hero === 'CareMomentRing';
  const showPrimaryCard = composition?.slots.primary_card !== null;
  const showStats = composition?.slots.stats_row !== null;

  return (
    <CareSurfaceFrame phase="injection" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
      <CarePhaseStrip activePhase="injection" />
      {showRingHero ? <CareMomentRing card={primary} generatedAt={context.generatedAt} /> : <CompactHeroGreeting phase="injection" momentCopy={composition?.momentCopy} />}
      {showPrimaryCard ? <MissionCardPair primary={primaryMission} secondary={secondaryMission} /> : null}
      {showStats ? <QuickStatRow stats={stats} /> : null}
      <PartnerConnectBar
        description={sharedCount > 0
          ? `${sharedCount}개의 케어 단서가 파트너에게 행동으로 전달됩니다`
          : '파트너 공유 링크를 연결하면 역할이 자동으로 보여요'}
      />
      <HomeUtilityLauncher />
    </CareSurfaceFrame>
  );
}

function extractDrug(title: string): string {
  return KNOWN_DRUGS.find((d) => title.includes(d))
    ?? title.replace(/^\d{1,2}:\d{2}\s*/u, '').split(' ')[0]
    ?? '확인 필요';
}
