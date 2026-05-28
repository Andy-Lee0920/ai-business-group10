import type { ScheduleType } from '../types/slc.types';

export interface ClinicUpdateScheduleItemInput {
  medicationId: string | null;
  type: ScheduleType;
  title: string;
  dose: string | null;
  unit: string | null;
  scheduledAt: string;
}

interface BuildClinicUpdateScheduleItemsInput {
  nextVisitAt: string;
  addedMedications: Array<{ id: string | null; title: string; unit: string | null }>;
  now?: Date;
}

export function prefillNextVisitDate(days: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function buildClinicUpdateScheduleItems({ nextVisitAt, addedMedications, now = new Date() }: BuildClinicUpdateScheduleItemsInput): ClinicUpdateScheduleItemInput[] {
  const clinicItems: ClinicUpdateScheduleItemInput[] = nextVisitAt
    ? [{
      medicationId: null,
      type: 'clinic',
      title: '다음 병원 방문',
      dose: null,
      unit: null,
      scheduledAt: `${nextVisitAt}T09:00:00.000`,
    }]
    : [];
  const todayAt19 = scheduledAtTodayKst('19:00', now);

  return [
    ...clinicItems,
    ...addedMedications.map((medication) => ({
      medicationId: medication.id,
      type: 'medication' as const,
      title: medication.title,
      dose: null,
      unit: medication.unit,
      scheduledAt: todayAt19,
    })),
  ];
}

function scheduledAtTodayKst(time: `${number}:${number}`, now: Date) {
  const [hours = '00', minutes = '00'] = time.split(':');
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kstNow.getUTCFullYear();
  const mm = String(kstNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kstNow.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000+09:00`;
}
