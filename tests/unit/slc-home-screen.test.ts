import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodayScreen } from '../../src/features/today/today-screen';
import type { ClinicUpdate, ScheduleItem } from '../../src/types/slc.types';

const item = (overrides: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'item-1',
  patient_id: 'patient-1',
  medication_id: null,
  type: 'injection',
  title: '고날에프',
  dose: null,
  unit: null,
  scheduled_at: '2026-05-14T09:00:00.000Z',
  status: 'upcoming',
  source: 'manual',
  created_at: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

const update = (overrides: Partial<ClinicUpdate>): ClinicUpdate => ({
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

describe('SLC home screen vertical slices', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders type-first clinic focus copy before medication detail on /home', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'med-now', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T09:05:00.000Z' }),
      item({ id: 'clinic-soon', type: 'clinic', title: '차병원 방문', scheduled_at: '2026-05-14T09:45:00.000Z' }),
    ]);

    expect(markup).toContain('data-focus-kind="clinic_soon"');
    expect(markup).toContain('병원 일정이 다가오고 있어요');
    expect(markup.indexOf('병원 일정이 다가오고 있어요')).toBeLessThan(markup.indexOf('듀파스톤'));
  });

  it('does not render post-clinic prompt after a relevant clinic update exists', () => {
    vi.setSystemTime(new Date('2026-05-14T10:30:00.000Z'));

    const markup = render(
      [item({ id: 'clinic-1', type: 'clinic', title: '차병원 방문', scheduled_at: '2026-05-14T09:00:00.000Z' })],
      [update({ created_at: '2026-05-14T10:05:00.000Z' })],
    );

    expect(markup).not.toContain('병원 다녀오셨나요?');
    expect(markup).not.toContain('업데이트하기');
  });
});

function render(initialItems: ScheduleItem[], initialClinicUpdates: ClinicUpdate[] = []) {
  return renderToStaticMarkup(React.createElement(TodayScreen, {
    initialItems,
    initialClinicUpdates,
    userId: 'patient-1',
  }));
}
