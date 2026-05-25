import { describe, expect, it } from 'vitest';
import type { ScheduleItem } from '../../src/types/slc.types';
import { getHomePendingItems, getSchedulePresentation, resolveHomeFocus, resolveHomeVisualAsset } from '../../src/domain/slc-home-focus';

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



  it('returns missed focus before upcoming schedules when today has a missed item', () => {
    const items = [
      baseItem({ id: 'late-injection', type: 'injection', title: 'Menopur', status: 'missed', scheduled_at: '2026-05-14T08:00:00.000Z' }),
      baseItem({ id: 'clinic-soon', type: 'clinic', title: '병원 방문', scheduled_at: '2026-05-14T09:45:00.000Z' }),
    ];

    expect(resolveHomeFocus(items, now)).toMatchObject({
      kind: 'missed',
      badgeLabel: '확인',
      heading: '확인이 필요한 일정이 있어요',
      primaryItem: { id: 'late-injection' },
    });
    expect(resolveHomeVisualAsset('missed').src).toBe('/assets/slc/home-missed-recovery.png');
  });

  it('prioritizes due medication over a clinic schedule within 60 minutes', () => {
    const items = [
      baseItem({ id: 'med-now', type: 'injection', title: '고날에프', scheduled_at: '2026-05-14T09:05:00.000Z' }),
      baseItem({ id: 'clinic-soon', type: 'clinic', title: '차병원 초음파', scheduled_at: '2026-05-14T09:45:00.000Z' }),
    ];

    expect(resolveHomeFocus(items, now)).toMatchObject({
      kind: 'medication_due',
      badgeLabel: '지금',
      heading: '확인할 시간이 가까워졌어요',
      primaryItem: { id: 'med-now' },
    });
    expect(getHomePendingItems(items, now).map((item) => item.id)).toEqual(['med-now', 'clinic-soon']);
  });

  it('keeps today medication context ahead of tomorrow clinic when no clinic is imminent today', () => {
    const items = [
      baseItem({ id: 'med-today', type: 'medication', title: '프로기노바', scheduled_at: '2026-05-14T11:00:00.000Z' }),
      baseItem({ id: 'clinic-tomorrow', type: 'clinic', title: '내원', scheduled_at: '2026-05-15T00:30:00.000Z' }),
    ];

    expect(resolveHomeFocus(items, now)).toMatchObject({
      kind: 'medication_upcoming',
      badgeLabel: '다음',
      heading: '다음 일정이 준비되어 있어요',
      primaryItem: { id: 'med-today' },
    });
  });

  it('uses tomorrow clinic context when no today schedule competes with it', () => {
    const items = [
      baseItem({ id: 'clinic-tomorrow', type: 'clinic', title: '내원', scheduled_at: '2026-05-15T00:30:00.000Z' }),
    ];

    expect(resolveHomeFocus(items, now)).toMatchObject({
      kind: 'clinic_tomorrow',
      badgeLabel: '내일',
      heading: '내일 병원 준비를 확인해요',
      primaryItem: { id: 'clinic-tomorrow' },
    });
  });

  it('returns medication_due before medication_upcoming when no clinic focus exists', () => {
    const items = [
      baseItem({ id: 'med-later', type: 'medication', title: '듀파스톤', scheduled_at: '2026-05-14T11:00:00.000Z' }),
      baseItem({ id: 'injection-due', type: 'injection', title: '오가루트란', scheduled_at: '2026-05-14T09:10:00.000Z' }),
    ];

    expect(resolveHomeFocus(items, now)).toMatchObject({
      kind: 'medication_due',
      badgeLabel: '지금',
      heading: '확인할 시간이 가까워졌어요',
      primaryItem: { id: 'injection-due' },
    });
  });

  it('separates missed medication into a confirmation-first focus', () => {
    expect(resolveHomeFocus([baseItem({ id: 'med-missed', scheduled_at: '2026-05-14T08:00:00.000Z' })], now)).toMatchObject({
      kind: 'missed',
      badgeLabel: '확인',
      heading: '확인이 필요한 일정이 있어요',
      primaryItem: { id: 'med-missed' },
    });
  });

  it('returns upcoming medication focus before the empty state', () => {
    expect(resolveHomeFocus([baseItem({ id: 'med-upcoming', scheduled_at: '2026-05-14T11:00:00.000Z' })], now)).toMatchObject({
      kind: 'medication_upcoming',
      badgeLabel: '다음',
      primaryItem: { id: 'med-upcoming' },
    });
  });

  it('returns empty focus when no incomplete schedule exists', () => {
    expect(resolveHomeFocus([baseItem({ status: 'completed' })], now)).toMatchObject({
      kind: 'empty',
      heading: '쉬어가는 날',
      primaryItem: null,
    });
  });

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
