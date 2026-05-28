import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RecordsScreen } from '../../src/features/records/records-screen';
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
  id: 'clinic-update-1',
  patient_id: 'user-1',
  same_medication: null,
  added_medication_ids: [],
  medication_days: null,
  next_visit_at: null,
  trigger_plan: null,
  memo: '다음 방문 전 안내를 확인했어요.',
  created_at: '2026-05-14T10:10:00.000Z',
  ...overrides,
});

describe('SLC records screen', () => {
  it('shows journal/community entry points without duplicating schedule or billing rows', () => {
    const markup = renderToStaticMarkup(React.createElement(RecordsScreen, {
      items: [item({})],
      completions: [completion({})],
      clinicUpdates: [clinicUpdate({})],
    }));

    expect(markup).toContain('data-testid="community-preview"');
    expect(markup).not.toContain('data-testid="couple-journal-locked"');
    expect(markup).toContain('커플저널');
    expect(markup).toContain('공유 기록');
    expect(markup).toContain('최근 기록 0건');
    expect(markup).not.toContain('최근 활동 2건');
    expect(markup).not.toContain('data-testid="records-calm-card"');
    expect(markup).not.toContain('data-testid="records-timeline"');
    expect(markup).not.toContain('고날에프');
    expect(markup).not.toContain('오른쪽 아래');
    expect(markup).not.toContain('다음 방문 전 안내');
    expect(markup).not.toContain('예정 19:00 · 완료');
    expect(markup).not.toContain('시술비');
    expect(markup).not.toContain('비용');
    expect(markup).not.toContain('정부지원금');
    expect(markup).not.toContain('영수증');
  });

  it('uses the canonical records ambient asset instead of an inline empty-state illustration', () => {
    const source = readFileSync('src/features/records/records-screen.tsx', 'utf8');

    expect(source).toContain('AmbientStoryBackground');
    expect(source).toContain('slcAssets.home.missedRecovery');
    expect(source).not.toContain('SLCIllustration');
    expect(source).not.toContain('slcAssets.empty.records');
    expect(source).not.toContain('<img');
  });
});
