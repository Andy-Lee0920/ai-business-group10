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
    expect(markup).toContain('병원 시간이 가까워요');
    expect(markup).toContain('방문 시간만 먼저 볼게요');
    expect(markup.indexOf('병원 시간이 가까워요')).toBeLessThan(markup.indexOf('듀파스톤'));
  });



  it('visually promotes the current CTA card over the next schedule preview', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'injection-now', type: 'injection', title: 'Menopur', dose: '150', unit: 'IU', scheduled_at: '2026-05-14T09:10:00.000Z' }),
      item({ id: 'injection-next', type: 'injection', title: 'Cetrotide', dose: '0.25', unit: 'mg', scheduled_at: '2026-05-14T19:00:00.000Z' }),
    ]);

    expect(markup).toContain('data-card-emphasis="primary"');
    expect(markup).toContain('data-card-emphasis="secondary"');
    expect(markup).toContain('주사');
    expect(markup).toContain('border:1.5px solid #E8A898');
    expect(markup).toContain('background:#FFFBF8');
    expect(markup.indexOf('data-card-emphasis="primary"')).toBeLessThan(markup.indexOf('data-card-emphasis="secondary"'));
  });


  it('shows a first schedule saved from onboarding on /home', () => {
    vi.setSystemTime(new Date('2026-05-14T09:00:00.000Z'));

    const markup = render([
      item({ id: 'onboarding-first', type: 'injection', title: '고날에프 주사', source: 'onboarding_interview', scheduled_at: '2026-05-14T09:10:00.000Z' }),
    ]);

    expect(markup).toContain('고날에프 주사');
    expect(markup).toContain('주사');
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

  it('renders safe empty-home copy and partner approval actions', () => {
    const markup = renderToStaticMarkup(React.createElement(TodayScreen, {
      initialItems: [],
      initialClinicUpdates: [],
      userId: 'patient-1',
      pendingPartnerRequest: {
        id: 'link-1',
        patient_id: 'patient-1',
        partner_id: 'partner-1',
        invite_code: 'ABC123',
        status: 'requested',
        partner_profile: { display_name: '민수' },
      },
    }));

    expect(markup).toContain('병원 일정이나 투약 시간을 추가하면 오늘 할 일을 함께 볼 수 있어요');
    expect(markup).toContain('승인하기');
    expect(markup).toContain('나중에');
  });
});

function render(initialItems: ScheduleItem[], initialClinicUpdates: ClinicUpdate[] = []) {
  return renderToStaticMarkup(React.createElement(TodayScreen, {
    initialItems,
    initialClinicUpdates,
    userId: 'patient-1',
  }));
}
