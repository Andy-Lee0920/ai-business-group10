import { describe, expect, it } from 'vitest';
import { buildRecordsViewModel, injectionSiteLabel, RECORD_FILTERS } from '../../src/domain/slc-records';
import type { ClinicUpdate, CompletionRecord, ScheduleItem } from '../../src/types/slc.types';

const item = (overrides: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'item-1',
  patient_id: 'user-1',
  medication_id: null,
  type: 'injection',
  title: '고날에프',
  dose: null,
  unit: null,
  scheduled_at: '2026-05-14T10:00:00.000Z',
  status: 'completed',
  source: 'manual',
  created_at: '2026-05-14T09:00:00.000Z',
  ...overrides,
});

const completion = (overrides: Partial<CompletionRecord>): CompletionRecord => ({
  id: 'comp-1',
  schedule_item_id: 'item-1',
  patient_id: 'user-1',
  completed_at: '2026-05-14T10:05:00.000Z',
  injection_site: 'lower_right',
  ...overrides,
});

const clinicUpdate = (overrides: Partial<ClinicUpdate>): ClinicUpdate => ({
  id: 'update-1',
  patient_id: 'user-1',
  same_medication: false,
  added_medication_ids: ['med-1'],
  medication_days: 2,
  next_visit_at: '2026-05-16T00:00:00.000Z',
  trigger_plan: 'tomorrow',
  memo: '메모',
  created_at: '2026-05-14T11:00:00.000Z',
  ...overrides,
});

describe('SLC records view model', () => {
  it('exposes required filters including 변경 and groups completions and clinic changes by date', () => {
    expect(RECORD_FILTERS.map((filter) => filter.label)).toEqual(['전체', '투약', '병원', '변경']);

    const model = buildRecordsViewModel({
      items: [item({ type: 'injection' })],
      completions: [completion({})],
      clinicUpdates: [clinicUpdate({})],
      filter: 'all',
    });

    expect(model.groups).toHaveLength(1);
    expect(model.groups[0].records.map((record) => record.kind)).toEqual(['clinic_update', 'schedule']);
    expect(model.groups[0].records[1]).toMatchObject({
      title: '고날에프',
      meta: expect.stringContaining('오른쪽 아래'),
      statusLabel: '완료',
    });
  });

  it('supports change-only filtering and Korean injection site labels', () => {
    const model = buildRecordsViewModel({
      items: [item({ type: 'clinic' })],
      completions: [],
      clinicUpdates: [clinicUpdate({})],
      filter: 'change',
    });

    expect(model.groups[0].records).toHaveLength(1);
    expect(model.groups[0].records[0].title).toBe('병원 업데이트');
    expect(injectionSiteLabel('upper_left')).toBe('왼쪽 위');
    expect(injectionSiteLabel('lower_right')).toBe('오른쪽 아래');
  });
});
