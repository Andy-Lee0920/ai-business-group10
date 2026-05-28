import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConfirmSheet } from '../../src/components/confirm-sheet';
import type { ScheduleItem } from '../../src/types/slc.types';

const injection: ScheduleItem = {
  id: 'item-1',
  patient_id: 'patient-1',
  medication_id: 'gonal-f',
  type: 'injection',
  title: '고날에프',
  dose: '150',
  unit: 'IU',
  scheduled_at: '2026-05-14T09:00:00.000Z',
  status: 'due',
  source: 'manual',
  created_at: '2026-05-14T00:00:00.000Z',
};

describe('SLC injection confirm sheet render contract', () => {
  it('renders four immediate injection-site zones without a separate complete CTA', () => {
    const markup = renderToStaticMarkup(React.createElement(ConfirmSheet, {
      item: injection,
      onComplete: () => undefined,
      onClose: () => undefined,
    }));

    expect(markup).toContain('/assets/slc/abdomen-front.png');
    expect(markup).toContain('왼쪽 위 주사 위치');
    expect(markup).toContain('오른쪽 위 주사 위치');
    expect(markup).toContain('왼쪽 아래 주사 위치');
    expect(markup).toContain('오른쪽 아래 주사 위치');
    expect(markup).toContain('탭하면 해당 위치로 즉시 기록됩니다');
    expect(markup).not.toContain('주사 완료');
  });

  it('uses clinic-specific copy for clinic visit completion', () => {
    const clinic: ScheduleItem = {
      ...injection,
      id: 'clinic-1',
      medication_id: null,
      type: 'clinic',
      title: '병원 방문',
      dose: null,
      unit: null,
    };
    const markup = renderToStaticMarkup(React.createElement(ConfirmSheet, {
      item: clinic,
      onComplete: () => undefined,
      onClose: () => undefined,
    }));

    expect(markup).toContain('병원 방문을 완료했나요?');
    expect(markup).toContain('방문 완료');
    expect(markup).not.toContain('복용을 완료했나요?');
    expect(markup).not.toContain('복용 완료');
  });

  it('keeps medication-specific copy for medication completion', () => {
    const medication: ScheduleItem = {
      ...injection,
      id: 'medication-1',
      medication_id: 'med-1',
      type: 'medication',
      title: '질정',
      dose: '1',
      unit: '정',
    };
    const markup = renderToStaticMarkup(React.createElement(ConfirmSheet, {
      item: medication,
      onComplete: () => undefined,
      onClose: () => undefined,
    }));

    expect(markup).toContain('복용을 완료했나요?');
    expect(markup).toContain('복용 완료');
  });
});
