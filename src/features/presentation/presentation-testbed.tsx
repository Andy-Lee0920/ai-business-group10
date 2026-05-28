import Link from 'next/link';
import type { ClinicUpdate, CompletionRecord, PartnerLink, ScheduleItem } from '../../types/slc.types';

export type PresentationSurface = 'home' | 'calendar' | 'records' | 'more';

const TESTBED_LINKS: Array<{ key: PresentationSurface; href: string; label: string }> = [
  { key: 'home', href: '/home', label: '홈' },
  { key: 'calendar', href: '/calendar', label: '캘린더' },
  { key: 'records', href: '/records', label: '기록' },
  { key: 'more', href: '/more', label: '관리' },
];

export function PresentationTestbedNav({ current }: { current: PresentationSurface }) {
  return (
    <nav
      aria-label="Fevio presentation testbed"
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '4px 0',
      }}
    >
      {TESTBED_LINKS.map((link) => {
        const active = link.key === current;
        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: '0 0 auto',
              minHeight: 38,
              padding: '9px 14px',
              borderRadius: 999,
              background: active ? 'var(--slc-coral)' : 'rgba(255, 255, 255, 0.72)',
              color: active ? '#fff' : 'var(--slc-muted)',
              border: active ? '1px solid var(--slc-coral)' : '1px solid #EFE7E0',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 900,
              boxShadow: active ? '0 10px 24px rgba(196, 97, 74, 0.18)' : undefined,
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function buildPresentationItems(now = new Date()): ScheduleItem[] {
  return [
    makeItem('demo-completed-menopur', 'injection', 'Menopur', '150', 'IU', addMinutes(now, -150), 'completed'),
    makeItem('demo-missed-gonal-f', 'injection', 'Gonal-F', '150', 'IU', addMinutes(now, -42), 'missed'),
    makeItem('demo-due-cetrotide', 'injection', 'Cetrotide', '0.25', 'mg', addMinutes(now, 8), 'upcoming'),
    makeItem('demo-evening-crinone', 'medication', '크리논 질정', '1', '개', setDayTime(now, 0, 21, 0), 'upcoming'),
    makeItem('demo-clinic-visit', 'clinic', '난포 확인 방문', null, null, setDayTime(now, 1, 9, 30), 'upcoming'),
    makeItem('demo-trigger-ovidrel', 'injection', 'Ovidrel', null, 'syringe', setDayTime(now, 1, 22, 0), 'upcoming'),
  ];
}

export function buildPresentationCompletions(now = new Date()): CompletionRecord[] {
  return [
    {
      id: 'demo-completion-menopur',
      schedule_item_id: 'demo-completed-menopur',
      patient_id: 'presentation-user',
      completed_at: addMinutes(now, -142).toISOString(),
      injection_site: 'upper_left',
    },
  ];
}

export function buildPresentationClinicUpdates(now = new Date()): ClinicUpdate[] {
  return [
    {
      id: 'demo-clinic-update',
      patient_id: 'presentation-user',
      same_medication: false,
      added_medication_ids: ['cetrotide'],
      medication_days: 3,
      next_visit_at: setDayTime(now, 1, 9, 30).toISOString(),
      trigger_plan: 'tomorrow',
      memo: '용량 유지, 길항제 추가',
      created_at: addMinutes(now, -64).toISOString(),
    },
  ];
}

export function buildPresentationPartnerLinks(): { existingLink: PartnerLink; pendingRequest: PartnerLink } {
  return {
    existingLink: {
      id: 'demo-approved-link',
      patient_id: 'presentation-user',
      partner_id: 'presentation-partner',
      invite_code: 'FEVIO-DEMO',
      status: 'approved',
      approved_at: new Date().toISOString(),
      partner_profile: { display_name: '파트너' },
    },
    pendingRequest: {
      id: 'demo-requested-link',
      patient_id: 'presentation-user',
      partner_id: 'presentation-partner-2',
      invite_code: 'FEVIO-REQ',
      status: 'requested',
      requested_at: new Date().toISOString(),
      partner_profile: { display_name: '배우자' },
    },
  };
}

export type PresentationHomeScenario = {
  id: string;
  label: string;
  title: string;
  description: string;
  items: ScheduleItem[];
  firstScheduleSkipped?: boolean;
};

export function buildPresentationHomeScenarios(now = new Date()): PresentationHomeScenario[] {
  return [
    {
      id: 'due',
      label: '지금',
      title: '주사 시간이 가까울 때',
      description: '가장 급한 행동 하나와 다음 일정을 먼저 보여줍니다.',
      items: [
        makeItem('due-menopur', 'injection', 'Menopur', '150', 'IU', addMinutes(now, 8), 'upcoming'),
        makeItem('due-cetrotide', 'injection', 'Cetrotide', '0.25', 'mg', addMinutes(now, 70), 'upcoming'),
      ],
    },
    {
      id: 'missed',
      label: '확인',
      title: '놓친 일정이 있을 때',
      description: '비난하지 않고 완료 여부 확인만 앞으로 올립니다.',
      items: [
        makeItem('missed-gonal-f', 'injection', 'Gonal-F', '150', 'IU', addMinutes(now, -42), 'missed'),
        makeItem('missed-crinone', 'medication', '크리논 질정', '1', '개', addMinutes(now, 180), 'upcoming'),
      ],
    },
    {
      id: 'clinic',
      label: '병원',
      title: '내일 방문이 있을 때',
      description: '방문 시간과 준비 행동을 낮은 밀도로 남깁니다.',
      items: [
        makeItem('clinic-visit', 'clinic', '난포 확인 방문', null, null, setDayTime(now, 1, 9, 30), 'upcoming'),
        makeItem('clinic-ovidrel', 'injection', 'Ovidrel', null, 'syringe', setDayTime(now, 1, 22, 0), 'upcoming'),
      ],
    },
    {
      id: 'empty',
      label: '비어 있음',
      title: '아직 일정이 없을 때',
      description: '처방지나 병원 문자를 추가하는 다음 행동만 남깁니다.',
      items: [],
      firstScheduleSkipped: true,
    },
  ];
}

function makeItem(
  id: string,
  type: ScheduleItem['type'],
  title: string,
  dose: string | null,
  unit: string | null,
  scheduledAt: Date,
  status: ScheduleItem['status'],
): ScheduleItem {
  return {
    id,
    patient_id: 'presentation-user',
    medication_id: type === 'clinic' ? null : id,
    type,
    title,
    dose,
    unit,
    scheduled_at: scheduledAt.toISOString(),
    status,
    source: 'seed',
    created_at: new Date().toISOString(),
  };
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function setDayTime(base: Date, dayOffset: number, hour: number, minute: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}
