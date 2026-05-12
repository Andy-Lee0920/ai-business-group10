import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CareSurfaceFrame,
  MomentHero,
  OperationalGlassSheet,
  PartnerPresencePulse,
  QuietChecklist,
} from './care-surface-primitives';
import { toQuietChecklistItems } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

export function WaitingDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const visibleCards = toQuietChecklistItems(context.cards, {
    fallbackDescription: '오늘은 필요한 일정만 조용히 확인해요.',
    badge: '천천히',
    limit: 2,
  });
  const primary = visibleCards[0];

  return (
    <CareSurfaceFrame phase="waiting">
      <MomentHero
        phase="waiting"
        eyebrow="Quiet care"
        title="오늘은 조용히 살피는 날"
        fact={`${primary?.title ?? '다음 일정'} · 확인보다 회복을 먼저 놓아요.`}
        actionLabel="오늘 상태 남기기"
        actionHint="더 많이 묻지 않고, 필요한 신호만 낮게 남깁니다."
      />

      <PartnerPresencePulse
        title="오늘은 곁에 있는 사람"
        description="결과를 재촉하지 않고 물, 식사, 쉬는 시간을 먼저 건네는 역할로 보여요."
      />

      <OperationalGlassSheet title="낮은 밀도의 확인" description={context.primaryMessage}>
        <QuietChecklist label="오늘 확인할 일정" items={visibleCards} />
        <HomeUtilityLauncher />
      </OperationalGlassSheet>
    </CareSurfaceFrame>
  );
}
