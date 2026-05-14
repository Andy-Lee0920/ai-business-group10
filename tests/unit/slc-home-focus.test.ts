import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '../../src/types/slc.types';
import { getHomePendingItems, getSchedulePresentation } from '../../src/domain/slc-home-focus';

const baseItem = (overrides: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'item-1',
  patient_id: 'patient-1',
  medication_id: null,
  type: 'injection',
  title: 'Menopur',
  dose: '150',
  unit: 'IU',
  scheduled_at: '2026-05-14T10:00:00.000Z',
  status: 'upcoming',
  source: 'seed',
  created_at: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

describe('SLC home focus', () => {
  const now = new Date('2026-05-14T09:00:00.000Z');

  it('uses the nearest incomplete schedule as the first home card regardless of type', () => {
    const items = [
      baseItem({ id: 'clinic-later', type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-14T12:00:00.000Z' }),
      baseItem({ id: 'med-first', type: 'medication', title: 'Duphaston', scheduled_at: '2026-05-14T09:30:00.000Z' }),
      baseItem({ id: 'injection-completed', status: 'completed', title: 'Menopur', scheduled_at: '2026-05-14T08:00:00.000Z' }),
    ];

    expect(getHomePendingItems(items, now).map((item) => item.id)).toEqual(['med-first', 'clinic-later']);
  });

  it('presents due soon schedules with coral emphasis', () => {
    const item = baseItem({ scheduled_at: '2026-05-14T09:10:00.000Z' });

    expect(getSchedulePresentation(item, now)).toMatchObject({
      status: 'due_soon',
      badgeLabel: '지금',
      badgeTone: 'coral',
    });
  });

  it('presents upcoming schedules within 60 minutes with amber warning', () => {
    const item = baseItem({ scheduled_at: '2026-05-14T09:45:00.000Z' });

    expect(getSchedulePresentation(item, now)).toMatchObject({
      status: 'upcoming',
      badgeLabel: '곧',
      badgeTone: 'amber',
    });
  });

  it('keeps schedules more than 60 minutes away in the default tone', () => {
    const item = baseItem({ scheduled_at: '2026-05-14T10:30:00.000Z' });

    expect(getSchedulePresentation(item, now)).toMatchObject({
      status: 'upcoming',
      badgeLabel: '다음',
      badgeTone: 'default',
    });
  });
});
