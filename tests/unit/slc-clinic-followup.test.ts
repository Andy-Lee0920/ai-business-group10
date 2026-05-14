import { describe, expect, it } from 'vitest';
import type { ClinicUpdate, ScheduleItem } from '../../src/types/slc.types';
import { getClinicFollowUpPrompt, resolveClinicFollowUpPrompt } from '../../src/domain/slc-clinic-followup';

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

const clinicUpdate = (overrides: Partial<ClinicUpdate> = {}): ClinicUpdate => ({
  id: 'update-1',
  patient_id: 'patient-1',
  same_medication: true,
  added_medication_ids: [],
  medication_days: null,
  next_visit_at: null,
  trigger_plan: null,
  memo: null,
  created_at: '2026-05-14T10:05:00.000Z',
  ...overrides,
});

describe('SLC clinic follow-up prompt', () => {
  it('does not show at scheduled time plus 59 minutes', () => {
    const now = new Date('2026-05-14T09:59:00.000Z');

    expect(getClinicFollowUpPrompt([clinicItem()], now)).toBeNull();
  });

  it('shows for an incomplete clinic schedule at scheduled time plus 60 minutes', () => {
    const now = new Date('2026-05-14T10:00:00.000Z');

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

  it('hides after a relevant clinic update exists even if the clinic item is not completed', () => {
    const now = new Date('2026-05-14T10:30:00.000Z');

    expect(resolveClinicFollowUpPrompt([clinicItem()], [clinicUpdate()], now)).toBeNull();
  });

  it('does not hide from an older clinic update saved before the clinic appointment', () => {
    const now = new Date('2026-05-14T10:30:00.000Z');

    expect(resolveClinicFollowUpPrompt(
      [clinicItem()],
      [clinicUpdate({ id: 'older-update', created_at: '2026-05-14T08:00:00.000Z' })],
      now,
    )?.id).toBe('clinic-1');
  });
});
