import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CareMomentRing,
  CareSurfaceFrame,
  MomentHero,
  OperationalGlassSheet,
  PartnerPresencePulse,
  QuietChecklist,
} from './care-surface-primitives';
import { countPartnerActionSignals, findPrimaryCareCard, toQuietChecklistItems } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

export function InjectionDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const primary = findPrimaryCareCard(context.cards, '고날에프');
  const sharedCount = countPartnerActionSignals(context.cards);
  const checklistItems = toQuietChecklistItems(context.cards, {
    fallbackDescription: '내가 확인한 내용만 기준으로 볼게요.',
    badge: (card) => (card.displaySafetyLevel === 'critical' ? '먼저 확인' : '다음 차례'),
  });

  return (
    <CareSurfaceFrame phase="injection">
      <MomentHero
        phase="injection"
        eyebrow="Injection care"
        title="오늘은 시간을 함께 지키는 날"
        fact={`${primary?.title ?? '확인한 주사 시간'} · 준비는 서두르지 않고 30분 전부터 시작해요.`}
        actionLabel="준비물 확인하기"
        actionHint="펜, 알코올솜, 조용한 공간만 먼저 맞춰요."
      >
        <CareMomentRing card={primary} generatedAt={context.generatedAt} />
      </MomentHero>

      <OperationalGlassSheet title="조용한 준비 흐름" description="확정된 시간과 준비물만 아래에 두고, 판단이 필요한 내용은 새로 만들지 않아요.">
        <QuietChecklist
          label="조용한 준비 체크리스트"
          items={checklistItems}
        />
        <PartnerPresencePulse
          title="역할이 함께 보이고 있어요"
          description={`${sharedCount}개의 케어 단서가 파트너에게 행동으로 전달됩니다. 원문 대신 지금 도울 일만 보여요.`}
        />
        <HomeUtilityLauncher />
      </OperationalGlassSheet>
    </CareSurfaceFrame>
  );
}
