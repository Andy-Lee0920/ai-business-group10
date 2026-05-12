import { buildResultProtectionSurface } from '../../domain/result-protection';
import {
  CareSurfaceFrame,
  CompactHeroGreeting,
  PartnerConnectBar,
  QuietChecklist,
} from './care-surface-primitives';
import { HomeUtilityLauncher } from './home-utility-launcher';
import { PartnerInviteCard } from './partner-invite-card';
import { shouldShowPartnerInviteCard, shouldShowPartnerProjection } from './partner-projection';
import type { AdaptiveStateHomeBaseProps } from './types';

export function ResultProtectionHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const today = context.generatedAt.slice(0, 10);
  const surface = buildResultProtectionSurface({ betaRecordedAt: today, now: today });

  return (
    <CareSurfaceFrame phase="waiting" context={context} intensity={composition?.intensity ?? 0.12} appliedRules={composition?.appliedRules}>
      <CompactHeroGreeting phase="waiting" title="오늘은 보호 모드" momentCopy={surface.heroCopy} />
      <QuietChecklist
        label="오늘 남겨둘 것"
        items={[
          { id: 'decide-later', title: surface.primaryAction, description: '일정, 병원 선택, 다음 계획은 오늘 정하지 않아도 돼요.', badge: '보호' },
          { id: 'routine-medication', title: '필요한 약 알림만 유지', description: '일상적인 약·주사 알림은 남기고 나머지 재촉은 줄여요.', badge: '저소음' },
        ]}
      />
      <details data-testid="result-review-gate">
        <summary>{surface.reviewClosedLabel}</summary>
        <p>이번 주기 기록은 사용자가 열 때만 보여요. 확인된 일정과 기록만 차분히 정리합니다.</p>
      </details>
      {shouldShowPartnerProjection(context) ? <PartnerConnectBar description={surface.partnerGuidance} /> : null}
      {shouldShowPartnerInviteCard(context) ? <PartnerInviteCard /> : null}
      <HomeUtilityLauncher fullSetupPending={context.onboardingQuickCaptureDone === true} />
    </CareSurfaceFrame>
  );
}
