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
}

export function prefillNextVisitDate(days: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function buildClinicUpdateScheduleItems({ nextVisitAt, addedMedications }: BuildClinicUpdateScheduleItemsInput): ClinicUpdateScheduleItemInput[] {
  if (!nextVisitAt) return [];
  const visitAt = `${nextVisitAt}T09:00:00.000`;
  const clinicVisit: ClinicUpdateScheduleItemInput = {
    medicationId: null,
    type: 'clinic',
    title: '다음 병원 방문',
    dose: null,
    unit: null,
    scheduledAt: visitAt,
  };

  return [
    clinicVisit,
    ...addedMedications.map((medication) => ({
      medicationId: medication.id,
      type: 'medication' as const,
      title: medication.title,
      dose: null,
      unit: medication.unit,
      scheduledAt: visitAt,
    })),
  ];
}
