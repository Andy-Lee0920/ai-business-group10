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
import { toQuietChecklistItems, withChecklistBadge } from './care-surface-model';
import type { AdaptiveStateHomeBaseProps } from './types';

const DEFAULT_VISIT_STEPS = [
  {
    id: 'clinic-visit-arrival',
    title: '방문 시간 확인',
    description: '예약 시간 10분 전 도착을 목표로 이동 시간을 먼저 확인해요.',
  },
  {
    id: 'clinic-visit-documents',
    title: '준비물 챙기기',
    description: '신분증, 진료카드, 최근 복용한 약 이름을 함께 확인해요.',
  },
  {
    id: 'clinic-visit-questions',
    title: '진료실 질문 정리',
    description: '채혈·초음파 결과와 다음 일정에서 꼭 물어볼 내용을 메모해요.',
  },
];

export function ClinicDayHome({ context }: AdaptiveStateHomeBaseProps) {
  const checklistItems = context.cards.length > 0
    ? toQuietChecklistItems(context.cards, { fallbackDescription: '확인된 일정만 차분히 볼게요.', badge: '방문 준비' })
    : withChecklistBadge(DEFAULT_VISIT_STEPS, '방문 준비');
  const primary = checklistItems[0];
  const secondary = checklistItems[1] ?? null;

  const stats = [
    { label: '방문', value: '09:00' },
    { label: '검사', value: '채혈·초음파' },
    { label: '질문', value: `${Math.max(checklistItems.length - 1, 1)}개` },
    { label: '파트너', value: '동행' },
  ] as const;

  return (
    <CareSurfaceFrame phase="clinic">
      <CarePhaseStrip activePhase="clinic" />
      <CompactHeroGreeting phase="clinic" />
      <MissionCardPair
        primary={primary ? { title: primary.title, time: '진료 전 확인', cta: '진료 브리핑 열기' } : null}
        secondary={secondary ? { title: secondary.title, time: '같이 챙기기' } : null}
      />
      <QuickStatRow stats={stats} />
      <QuietChecklist label="진료 브리핑 항목" items={checklistItems.slice(0, 3)} />
      <PartnerConnectBar description="이동 시간, 접수, 진료 후 다음 일정을 함께 붙잡는 역할로 보여요" />
      <HomeUtilityLauncher />
    </CareSurfaceFrame>
  );
}
