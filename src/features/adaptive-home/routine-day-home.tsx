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

export function RoutineDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const items = toQuietChecklistItems(context.cards, {
    fallbackDescription: '오늘 필요한 것만 낮은 밀도로 확인해요.',
    badge: '오늘 챙길 일',
  });

  return (
    <CareSurfaceFrame phase="routine">
      <MomentHero
        phase="routine"
        eyebrow="Daily care"
        title="오늘은 필요한 것만 남기는 날"
        fact="해야 할 일과 쉬어도 되는 일을 나눠서 보여드릴게요."
        actionLabel="오늘 흐름 보기"
        actionHint="새로 판단하지 않고 확정된 케어만 정리합니다."
      />
      <OperationalGlassSheet title="오늘의 낮은 밀도 흐름" description={context.primaryMessage}>
        {items.length > 0 ? <QuietChecklist label="오늘 케어 흐름" items={items} /> : null}
        <PartnerPresencePulse
          state={items.length > 0 ? 'shared' : 'unknown'}
          title="공유할 준비가 되어 있어요"
          description="파트너에게 보낼 내용은 원문이 아니라 도움 행동으로 바뀝니다."
        />
        <HomeUtilityLauncher />
      </OperationalGlassSheet>
    </CareSurfaceFrame>
  );
}
