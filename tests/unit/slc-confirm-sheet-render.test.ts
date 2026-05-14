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
});
