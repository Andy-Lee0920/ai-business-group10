import type { ClinicUpdate, CompletionRecord, InjectionSite, ScheduleItem, ScheduleType } from '../types/slc.types';

export type RecordsFilter = 'all' | 'medication' | 'clinic' | 'change';

export const RECORD_FILTERS: Array<{ key: RecordsFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'medication', label: '투약' },
  { key: 'clinic', label: '병원' },
  { key: 'change', label: '변경' },
];

export interface RecordsViewRecord {
  id: string;
  kind: 'schedule' | 'clinic_update';
  type: ScheduleType | 'change';
  title: string;
  at: string;
  meta: string;
  statusLabel: string;
}

export interface RecordsViewGroup {
  date: string;
  records: RecordsViewRecord[];
}

interface BuildRecordsViewModelInput {
  items: ScheduleItem[];
  completions: CompletionRecord[];
  clinicUpdates: ClinicUpdate[];
  filter: RecordsFilter;
}

export function buildRecordsViewModel({ items, completions, clinicUpdates, filter }: BuildRecordsViewModelInput): { groups: RecordsViewGroup[] } {
  const completionMap = new Map(completions.map((completion) => [completion.schedule_item_id, completion]));
  const scheduleRecords = items
    .filter((item) => matchesScheduleFilter(item.type, filter))
    .map((item): RecordsViewRecord => {
      const completion = completionMap.get(item.id);
      const scheduledTime = formatTime(item.scheduled_at);
      const completedTime = completion ? formatTime(completion.completed_at) : null;
      const site = completion?.injection_site ? ` · ${injectionSiteLabel(completion.injection_site)}` : '';
      return {
        id: item.id,
        kind: 'schedule',
        type: item.type,
        title: item.title,
        at: completion?.completed_at ?? item.scheduled_at,
        meta: `예정 ${scheduledTime}${completedTime ? ` · 완료 ${completedTime}` : ''}${site}`,
        statusLabel: item.status === 'completed' || completion ? '완료' : item.status === 'missed' ? '놓침' : '예정',
      };
    });

  const changeRecords = clinicUpdates
    .filter(() => filter === 'all' || filter === 'change')
    .map((update): RecordsViewRecord => ({
      id: update.id,
      kind: 'clinic_update',
      type: 'change',
      title: '병원 업데이트',
      at: update.created_at,
      meta: clinicUpdateMeta(update),
      statusLabel: '변경',
    }));

  return { groups: groupByDate([...scheduleRecords, ...changeRecords].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())) };
}

export function injectionSiteLabel(site: InjectionSite): string {
  const labels: Record<InjectionSite, string> = {
    upper_left: '왼쪽 위',
    upper_right: '오른쪽 위',
    lower_left: '왼쪽 아래',
    lower_right: '오른쪽 아래',
  };
  return labels[site];
}

function matchesScheduleFilter(type: ScheduleType, filter: RecordsFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'medication') return isMedicationType(type);
  if (filter === 'clinic') return type === 'clinic';
  return false;
}

function isMedicationType(type: ScheduleType): boolean {
  return type === 'injection' || type === 'medication';
}

function clinicUpdateMeta(update: ClinicUpdate): string {
  const parts = [
    update.same_medication === true ? '기존 약 유지' : update.same_medication === false ? '약 변경 있음' : '약 변경 미확인',
    update.medication_days ? `${update.medication_days}일치` : null,
    update.next_visit_at ? `다음 방문 ${formatDate(update.next_visit_at)}` : null,
    update.trigger_plan ? `트리거 ${triggerLabel(update.trigger_plan)}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

function triggerLabel(trigger: NonNullable<ClinicUpdate['trigger_plan']>): string {
  const labels: Record<NonNullable<ClinicUpdate['trigger_plan']>, string> = {
    today: '오늘',
    tomorrow: '내일',
    not_yet: '아직',
    unknown: '모름',
  };
  return labels[trigger];
}

function groupByDate(records: RecordsViewRecord[]): RecordsViewGroup[] {
  const map = new Map<string, RecordsViewRecord[]>();
  for (const record of records) {
    const date = formatGroupDate(record.at);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(record);
  }
  return Array.from(map.entries()).map(([date, dateRecords]) => ({ date, records: dateRecords }));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function formatGroupDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}
