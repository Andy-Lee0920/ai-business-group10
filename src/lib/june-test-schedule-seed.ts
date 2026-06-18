import type { ScheduleItem } from '../types/slc.types';

export const FEVIO_JUNE_TEST_SEED_COOKIE = 'fevio_test_seed_june_2026';

export function isJuneTestScheduleSeedEnabled(cookieValue: string | undefined) {
  return cookieValue === '1';
}

export function juneTestScheduleItems(patientId: string): ScheduleItem[] {
  const createdAt = '2026-06-17T00:00:00.000+09:00';
  return [
    item(patientId, 1, 'clinic', '[테스트] 초음파/채혈 확인', null, null, '2026-06-17T09:30:00+09:00', createdAt),
    item(patientId, 2, 'injection', '[테스트] 고날에프 주사', '150', 'IU', '2026-06-17T21:00:00+09:00', createdAt),
    item(patientId, 3, 'injection', '[테스트] 고날에프 주사', '150', 'IU', '2026-06-18T21:00:00+09:00', createdAt),
    item(patientId, 4, 'clinic', '[테스트] 난포 확인 방문', null, null, '2026-06-19T09:30:00+09:00', createdAt),
    item(patientId, 5, 'injection', '[테스트] 오비드렐 트리거 확인', '250', 'μg', '2026-06-19T22:00:00+09:00', createdAt),
    item(patientId, 6, 'clinic', '[테스트] 채혈/시술 전 확인', null, null, '2026-06-20T09:00:00+09:00', createdAt),
    item(patientId, 7, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-20T21:00:00+09:00', createdAt),
    item(patientId, 8, 'clinic', '[테스트] 시술/경과 확인', null, null, '2026-06-21T09:30:00+09:00', createdAt),
    item(patientId, 9, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-22T09:00:00+09:00', createdAt),
    item(patientId, 10, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-23T09:00:00+09:00', createdAt),
    item(patientId, 11, 'clinic', '[테스트] 다음 확인 방문', null, null, '2026-06-24T09:30:00+09:00', createdAt),
    item(patientId, 12, 'medication', '[테스트] 프로게스테론', '1', '정', '2026-06-25T09:00:00+09:00', createdAt),
  ];
}

export function mergeJuneTestScheduleItems(items: ScheduleItem[], patientId: string, enabled: boolean) {
  if (!enabled) return items;
  const merged = [...items, ...juneTestScheduleItems(patientId)];
  return merged.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
}

function item(
  patientId: string,
  index: number,
  type: ScheduleItem['type'],
  title: string,
  dose: string | null,
  unit: string | null,
  scheduledAt: string,
  createdAt: string,
): ScheduleItem {
  return {
    id: `june-test-seed-2026-${index}`,
    patient_id: patientId,
    medication_id: null,
    type,
    title,
    dose,
    unit,
    scheduled_at: scheduledAt,
    status: 'upcoming',
    source: 'manual',
    created_at: createdAt,
  };
}
