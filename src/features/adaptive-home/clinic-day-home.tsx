import { HomeUtilityLauncher } from './home-utility-launcher';
import { PartnerInviteCard } from './partner-invite-card';
import { shouldShowPartnerInviteCard, shouldShowPartnerProjection } from './partner-projection';
import {
  CarePhaseStrip,
  CareSurfaceFrame,
  CompactHeroGreeting,
  MissionCardPair,
  PartnerConnectBar,
  QuickStatRow,
  QuietChecklist,
} from './care-surface-primitives';
import { toQuietChecklistItems, withChecklistBadge } from './care-surface-model';
import { deriveClinicFocus } from './clinic-focus-package';
import type { AdaptiveStateHomeBaseProps } from './types';

type ClinicChecklistItem = ReturnType<typeof toQuietChecklistItems>[number];

const DEFAULT_VISIT_STEPS: Omit<ClinicChecklistItem, 'badge'>[] = [
  {
    id: 'clinic-visit-arrival',
    title: '방문 시간 확인',
    description: '예약 시간 10분 전 도착을 목표로 이동 시간을 먼저 확인해요.',
  },
  {
    id: 'clinic-visit-medication-review',
    title: '약·주사 기록 복기',
    description: '지난 방문 이후 맞은 주사와 바뀐 약을 한 번에 확인해요.',
  },
  {
    id: 'clinic-visit-condition-review',
    title: '몸 상태 변화 확인',
    description: '기록해 둔 증상과 컨디션 변화를 진료 전 차분히 떠올려요.',
  },
];

export function ClinicDayHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const checklistItems = context.cards.length > 0
    ? toQuietChecklistItems(context.cards, { fallbackDescription: '확인된 일정만 차분히 볼게요.', badge: '방문 준비' })
    : withChecklistBadge(DEFAULT_VISIT_STEPS, '방문 준비');
  const focus = deriveClinicFocus(context.cards, checklistItems);
  const primary = focus.items[0];
  const secondary = focus.items[1] ?? null;

  const showPrimaryCard = composition?.slots.primary_card !== null;
  const showStats = composition?.slots.stats_row !== null;
  const showChecklist = composition?.slots.checklist !== null;

  return (
    <CareSurfaceFrame phase="clinic" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
      <CarePhaseStrip activePhase="clinic" />
      <CompactHeroGreeting phase="clinic" momentCopy={composition?.momentCopy ?? focus.context} title={focus.title} />
      {showPrimaryCard ? <MissionCardPair
        primary={primary ? { label: focus.primaryLabel, title: primary.title, time: focus.primaryTime, cta: focus.primaryCta } : null}
        secondary={secondary ? { label: focus.secondaryLabel, title: secondary.title, time: focus.secondaryTime } : null}
      /> : null}
      {showStats ? <QuickStatRow stats={focus.stats(focus.items.length)} /> : null}
      {showChecklist ? <QuietChecklist label={focus.checklistLabel} items={focus.items.slice(0, 3)} /> : null}
      {shouldShowPartnerProjection(context) ? <PartnerConnectBar description={focus.partnerDescription} connected={context.partnerConnected === true} /> : null}
      {shouldShowPartnerInviteCard(context) ? <PartnerInviteCard /> : null}
      <HomeUtilityLauncher fullSetupPending={context.onboardingQuickCaptureDone === true} />
    </CareSurfaceFrame>
  );
}
