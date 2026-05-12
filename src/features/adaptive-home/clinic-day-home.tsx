import { HomeUtilityLauncher } from './home-utility-launcher';
import {
  CareSurfaceFrame,
  MomentHero,
  OperationalGlassSheet,
  PartnerPresencePulse,
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

  return (
    <CareSurfaceFrame phase="clinic">
      <OperationalGlassSheet title="오늘 진료실에 가지고 갈 것들" description="질문 2개 · 지난 7일 케어 기록 · 파트너 동행">
        <QuietChecklist label="진료 브리핑 항목" items={checklistItems} />
        <HomeUtilityLauncher />
      </OperationalGlassSheet>

      <MomentHero
        phase="clinic"
        eyebrow="Clinic care"
        title="오늘은 확인할 것이 있는 날"
        fact={`${primary?.title ?? '병원 방문'} · 이동과 질문을 한 번에 정리해요.`}
        actionLabel="방문 메모 열기"
        actionHint="방문 시간, 준비물, 물어볼 말을 같은 흐름에 둡니다."
      />

      <PartnerPresencePulse
        title="오늘은 동행자"
        description="이동 시간, 접수, 진료 후 다음 일정을 함께 붙잡는 역할로 보여요."
      />
    </CareSurfaceFrame>
  );
}
