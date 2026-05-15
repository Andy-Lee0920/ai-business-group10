import { buildTwoWeekWaitAnchor } from '../../domain/two-week-wait';
import {
  CarePhaseStrip,
  CareSurfaceFrame,
  CompactHeroGreeting,
  QuickStatRow,
  QuietChecklist,
} from './care-surface-primitives';
import { HomeUtilityLauncher } from './home-utility-launcher';
import type { AdaptiveStateHomeBaseProps } from './types';

export function TwoWeekWaitHome({ context, composition }: AdaptiveStateHomeBaseProps) {
  const dates = deriveDemoTwoWeekWaitDates(context.generatedAt);
  const anchor = buildTwoWeekWaitAnchor(dates);

  return (
    <CareSurfaceFrame phase="two_week_wait" context={context} intensity={composition?.intensity ?? 0.2} appliedRules={composition?.appliedRules}>
      <CarePhaseStrip activePhase="waiting" />
      <CompactHeroGreeting phase="two_week_wait" title={anchor.title} momentCopy={composition?.momentCopy ?? anchor.explanation} />
      <QuickStatRow
        stats={[
          { label: '오늘 기준', value: `D+${anchor.dayPostTransfer}` },
          { label: '피검까지', value: `${anchor.daysUntilBeta}일` },
          { label: '오늘 역할', value: '판단 보류' },
        ]}
      />
      <QuietChecklist
        label="2WW 저소음 체크인"
        items={[
          { id: 'body', title: '몸 상태 한 줄', description: '증상은 해석하지 않고 있는 그대로만 적어요.', badge: '기록' },
          { id: 'mind', title: '마음 상태 한 줄', description: anchor.judgementBoundary, badge: '보류' },
        ]}
      />
      <HomeUtilityLauncher fullSetupPending={context.onboardingQuickCaptureDone === true} />
    </CareSurfaceFrame>
  );
}

function deriveDemoTwoWeekWaitDates(generatedAt: string) {
  const today = new Date(generatedAt);
  const transfer = addDays(today, -3);
  const beta = addDays(today, 7);
  return {
    today: toIsoDate(today),
    transferDate: toIsoDate(transfer),
    betaDate: toIsoDate(beta),
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
