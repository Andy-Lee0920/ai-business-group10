import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CarePhaseStrip,
  CareSurfaceFrame,
  CompactHeroGreeting,
  MissionCardPair,
  PartnerConnectBar,
  QuickStatRow,
  QuietChecklist,
} from './care-surface-primitives';
import { toMissionCardData, toQuietChecklistItems } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

export function RoutineDayHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const items = toQuietChecklistItems(context.cards, {
    fallbackDescription: '확정된 내용만 차분히 확인해요.',
    badge: '오늘 챙길 일',
    limit: 3,
  });
  const primary = context.cards[0] ? { ...toMissionCardData(context.cards[0]), cta: '오늘 케어 보기' } : null;
  const secondary = context.cards[1] ? toMissionCardData(context.cards[1]) : null;
  const stats = [
    { label: '오늘 할 일', value: `${items.length}개` },
    { label: '공유', value: '준비됨' },
    { label: '알림', value: '기본' },
    { label: '기록', value: '가능' },
  ] as const;

  const showPrimaryCard = composition?.slots.primary_card !== null;
  const showStats = composition?.slots.stats_row !== null;
  const showChecklist = composition?.slots.checklist !== null;

  return (
    <CareSurfaceFrame phase="routine" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
      <CarePhaseStrip activePhase="routine" />
      <CompactHeroGreeting phase="routine" momentCopy={composition?.momentCopy} />
      {showPrimaryCard ? <MissionCardPair primary={primary} secondary={secondary} /> : null}
      {showStats ? <QuickStatRow stats={stats} /> : null}
      {showChecklist && items.length > 0 ? <QuietChecklist label="오늘 케어 흐름" items={items} /> : null}
      <PartnerConnectBar description="파트너에게는 원문 대신 함께 확인할 역할만 보입니다" />
      <HomeUtilityLauncher />
    </CareSurfaceFrame>
  );
}
