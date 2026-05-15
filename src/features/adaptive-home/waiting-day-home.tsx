import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CarePhaseStrip,
  CareSurfaceFrame,
  CompactHeroGreeting,
  QuietChecklist,
} from './care-surface-primitives';
import { toQuietChecklistItems } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

export function WaitingDayHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const visibleCards = toQuietChecklistItems(context.cards, {
    fallbackDescription: '확정된 다음 일정과 컨디션만 확인해요.',
    badge: '천천히',
    limit: 2,
  });

  const showChecklist = composition?.slots.checklist !== null;

  return (
    <CareSurfaceFrame phase="waiting" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
      <CarePhaseStrip activePhase="waiting" />
      <CompactHeroGreeting phase="waiting" momentCopy={composition?.momentCopy} />
      {showChecklist && visibleCards.length > 0 ? (
        <QuietChecklist label="오늘 확인할 일정" items={visibleCards} />
      ) : null}
      <HomeUtilityLauncher fullSetupPending={context.onboardingQuickCaptureDone === true} />
    </CareSurfaceFrame>
  );
}
