import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CarePhaseStrip,
  CareSurfaceFrame,
  CompactHeroGreeting,
  PartnerConnectBar,
  QuietChecklist,
} from './care-surface-primitives';
import { countPartnerActionSignals, toQuietChecklistItems } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

export function WaitingDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const visibleCards = toQuietChecklistItems(context.cards, {
    fallbackDescription: '오늘은 필요한 일정만 조용히 확인해요.',
    badge: '천천히',
    limit: 2,
  });
  const sharedCount = countPartnerActionSignals(context.cards);

  return (
    <CareSurfaceFrame phase="waiting" context={context}>
      <CarePhaseStrip activePhase="waiting" />
      <CompactHeroGreeting phase="waiting" />
      {visibleCards.length > 0 ? (
        <QuietChecklist label="오늘 확인할 일정" items={visibleCards} />
      ) : null}
      <PartnerConnectBar
        description="결과를 재촉하지 않고 물과 식사와 쉬는 시간을 먼저 건네요"
      />
      <HomeUtilityLauncher />
    </CareSurfaceFrame>
  );
}
