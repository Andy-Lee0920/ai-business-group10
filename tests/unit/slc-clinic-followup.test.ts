import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '../../src/types/slc.types';
import { getClinicFollowUpPrompt } from '../../src/domain/slc-clinic-followup';

const clinicItem = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
  id: 'clinic-1',
  patient_id: 'patient-1',
  medication_id: null,
  type: 'clinic',
  title: '차병원 방문',
  dose: null,
  unit: null,
  scheduled_at: '2026-05-14T09:00:00.000Z',
  status: 'upcoming',
  source: 'manual',
  created_at: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

describe('SLC clinic follow-up prompt', () => {
  it('does not show before scheduled time plus one hour has passed', () => {
    const now = new Date('2026-05-14T10:00:00.000Z');

    expect(getClinicFollowUpPrompt([clinicItem()], now)).toBeNull();
  });

  it('shows for an incomplete clinic schedule after scheduled time plus one hour', () => {
    const now = new Date('2026-05-14T10:01:00.000Z');

    expect(getClinicFollowUpPrompt([clinicItem()], now)?.id).toBe('clinic-1');
  });

  it('does not show after the clinic schedule is completed', () => {
    const now = new Date('2026-05-14T10:01:00.000Z');

    expect(getClinicFollowUpPrompt([clinicItem({ status: 'completed' })], now)).toBeNull();
  });

  it('ignores non-clinic schedules and clinic schedules outside today', () => {
    const now = new Date('2026-05-14T10:01:00.000Z');
    const medication = clinicItem({ id: 'med-1', type: 'medication', title: 'Duphaston' });
    const yesterdayClinic = clinicItem({ id: 'clinic-yesterday', scheduled_at: '2026-05-13T09:00:00.000Z' });

    expect(getClinicFollowUpPrompt([medication, yesterdayClinic], now)).toBeNull();
  });
});
