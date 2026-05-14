import { describe, expect, it } from 'vitest';
import { buildClinicUpdateScheduleItems, prefillNextVisitDate } from '../../src/domain/slc-clinic-update';

describe('clinic update guided form helpers', () => {
  it('prefills the next visit date from a days-of-medication answer', () => {
    expect(prefillNextVisitDate(2, new Date('2026-05-14T03:00:00.000Z'))).toBe('2026-05-16');
  });

  it('emits a required next clinic visit schedule item when next visit is known', () => {
    expect(buildClinicUpdateScheduleItems({
      nextVisitAt: '2026-05-16',
      addedMedications: [],
    })).toEqual([
      {
        medicationId: null,
        type: 'clinic',
        title: '다음 병원 방문',
        dose: null,
        unit: null,
        scheduledAt: '2026-05-16T09:00:00.000',
      },
    ]);
  });
});
