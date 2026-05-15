import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecordsScreen } from '../../src/features/records/records-screen';
import type { CompletionRecord, ScheduleItem } from '../../src/types/slc.types';

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

describe('SLC records screen', () => {
  it('renders records as calm scan-first cards instead of verbose timeline text', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [item({})],
      completions: [completion({})],
      clinicUpdates: [],
    }));

    expect(markup).toContain('최근 7일');
    expect(markup).toContain('완료한 일만 조용히 모아둘게요.');
    expect(markup).toContain('data-testid="records-calm-card"');
    expect(markup).toContain('주사');
    expect(markup).toContain('오른쪽 아래');
    expect(markup).not.toContain('예정 19:00 · 완료');
  });
});
