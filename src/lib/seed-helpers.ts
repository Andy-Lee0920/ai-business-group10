import type { ScheduleItem } from '../types/slc.types';

type SeedMode = 'presentation' | 'production';

type SeedScheduleItem = Pick<ScheduleItem, 'patient_id' | 'medication_id' | 'type' | 'title' | 'dose' | 'unit' | 'scheduled_at' | 'status' | 'source'>;

export function getSeedItems(patientId: string, mode: SeedMode): SeedScheduleItem[] {
  return mode === 'presentation' ? getPresentationSeedItems(patientId) : getProductionSeedItems(patientId);
}

export function getPresentationSeedItems(patientId: string, base = new Date()): SeedScheduleItem[] {
  return [
    makeInjection(patientId, 'menopur', 'Menopur 150 IU', '150', 'IU', addMinutes(base, 10)),
    makeInjection(patientId, 'cetrotide', 'Cetrotide 0.25 mg', '0.25', 'mg', addMinutes(base, 45)),
  ];
}

export function getProductionSeedItems(patientId: string, base = new Date()): SeedScheduleItem[] {
  return [makeInjection(patientId, 'menopur', 'Menopur 150 IU', '150', 'IU', getNextKstTimeAt(base, 6, 30))];
}

function makeInjection(patientId: string, medicationId: string, title: string, dose: string, unit: string, scheduledAt: Date): SeedScheduleItem {
  return {
    patient_id: patientId,
    medication_id: medicationId,
    type: 'injection',
    title,
    dose,
    unit,
    scheduled_at: scheduledAt.toISOString(),
    status: 'upcoming',
    source: 'seed',
  };
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function getNextKstTimeAt(base: Date, hour: number, minute: number) {
  const utcMs = base.getTime();
  const kst = new Date(utcMs + 9 * 60 * 60_000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  let targetUtc = Date.UTC(y, m, d, hour - 9, minute, 0, 0);
  if (targetUtc <= utcMs) targetUtc += 24 * 60 * 60_000;
  return new Date(targetUtc);
}
