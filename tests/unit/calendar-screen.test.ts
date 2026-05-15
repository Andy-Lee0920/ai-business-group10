import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CalendarScreen } from '../../src/features/calendar/calendar-screen';
import type { ScheduleItem } from '../../src/types/slc.types';

const item = (overrides: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'item-1',
  patient_id: 'patient-1',
  medication_id: null,
  type: 'injection',
  title: '고날에프',
  dose: null,
  unit: null,
  scheduled_at: '2026-05-15T09:00:00.000Z',
  status: 'upcoming',
  source: 'manual',
  created_at: '2026-05-14T00:00:00.000Z',
  ...overrides,
});

describe('CalendarScreen', () => {
  it('renders a monthly calendar with care dots and selected-date timeline', () => {
    const markup = renderToStaticMarkup(React.createElement(CalendarScreen, {
      initialDate: '2026-05-15T00:00:00.000Z',
      items: [
        item({ id: 'injection-1', title: 'Menopur', scheduled_at: '2026-05-15T10:00:00.000Z' }),
        item({ id: 'clinic-1', type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-15T12:00:00.000Z' }),
      ],
    }));

    expect(markup).toContain('aria-label="월 달력"');
    expect(markup).toContain('data-testid="calendar-care-dot"');
    expect(markup).toContain('data-testid="calendar-care-timeline"');
    expect(markup).toContain('Menopur');
    expect(markup).toContain('병원 방문');
    expect(markup).toContain('var(--slc-coral)');
  });

  it('shows the empty message when the selected date has no care cards', () => {
    const markup = renderToStaticMarkup(React.createElement(CalendarScreen, {
      initialDate: '2026-05-15T00:00:00.000Z',
      items: [item({ id: 'next-day', scheduled_at: '2026-05-16T10:00:00.000Z' })],
    }));

    expect(markup).toContain('이 날은 예정된 케어가 없습니다');
  });
});
