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
  const roleIntent = context.roleIntent;

  if (roleIntent?.firstFold === 'partner_assist_entry') {
    return (
      <CareSurfaceFrame phase="routine" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
        <CarePhaseStrip activePhase="routine" />
        <CompactHeroGreeting phase="routine" title="파트너로 도울 일" momentCopy="오늘 연결된 케어를 역할 중심으로 함께 확인해요." />
        <PartnerConnectBar description="환자 화면의 원문이 아니라 지금 도울 역할만 먼저 보여요" />
        <HomeUtilityLauncher />
      </CareSurfaceFrame>
    );
  }

  if (roleIntent?.firstFold === 'shared_cycle_invite') {
    return (
      <CareSurfaceFrame phase="routine" context={context} intensity={composition?.intensity} appliedRules={composition?.appliedRules}>
        <CarePhaseStrip activePhase="routine" />
        <CompactHeroGreeting phase="routine" title="함께 이어질 케어" momentCopy="초대가 연결되면 같은 케어 상태를 서로 다른 역할로 볼 수 있어요." />
        <PartnerConnectBar description="파트너 연결을 확인하고 공유 범위를 조정할 수 있어요" />
        <HomeUtilityLauncher />
      </CareSurfaceFrame>
    );
  }

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
