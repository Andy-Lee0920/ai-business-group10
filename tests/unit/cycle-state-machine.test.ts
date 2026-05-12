import { describe, expect, it } from 'vitest';
import { getConfirmedSurfacePhase, reduceCycleState } from '../../src/domain/cycle-state-machine';
import type { CycleEvent } from '../../src/types/cycle-event.types';

describe('reduceCycleState', () => {
  it('derives the normal confirmed path from stimulation through positive beta', () => {
    const events: CycleEvent[] = [
      { type: 'period_started', date: '2026-05-01', confirmedBy: 'user' },
      { type: 'stimulation_started', date: '2026-05-03', confirmedBy: 'clinic_note' },
      { type: 'retrieval_done', date: '2026-05-14', oocyteCount: 8, confirmedBy: 'clinic_note' },
      { type: 'embryo_culture_started', date: '2026-05-15', confirmedBy: 'clinic_note' },
      { type: 'embryo_transfer_done', date: '2026-05-19', confirmedBy: 'user' },
      { type: 'beta_test_recorded', date: '2026-05-29', resultStatus: 'positive', hcgValue: 240 },
    ];

    const state = reduceCycleState(events);

    expect(state.confirmedPhase).toBe('ultrasound_wait');
    expect(state.confidence).toBe('high');
    expect(state.evidence.at(-1)).toMatchObject({ eventType: 'beta_test_recorded', phase: 'ultrasound_wait' });
    expect(getConfirmedSurfacePhase(state)).toBe('ultrasound_wait');
  });

  it('handles retrieval cancellation as a confirmed exceptional branch', () => {
    const state = reduceCycleState([
      { type: 'stimulation_started', date: '2026-05-03', confirmedBy: 'user' },
      { type: 'retrieval_cancelled', date: '2026-05-12', reason: '난포 반응 부족', confirmedBy: 'clinic_note' },
    ]);

    expect(state.confirmedPhase).toBe('cycle_cancelled');
    expect(state.suggestedPhase).toBeNull();
    expect(state.evidence.at(-1)).toMatchObject({ eventType: 'retrieval_cancelled', phase: 'cycle_cancelled' });
  });

  it('routes negative beta into result protection instead of next-cycle planning', () => {
    const state = reduceCycleState([
      { type: 'embryo_transfer_done', date: '2026-05-19', confirmedBy: 'user' },
      { type: 'beta_test_recorded', date: '2026-05-29', resultStatus: 'negative', hcgValue: 0 },
    ]);

    expect(state.confirmedPhase).toBe('result_protection');
    expect(state.evidence.at(-1)).toMatchObject({ eventType: 'beta_test_recorded', phase: 'result_protection' });
  });

  it('routes repeat-needed beta into beta follow-up', () => {
    const state = reduceCycleState([
      { type: 'embryo_transfer_done', date: '2026-05-19', confirmedBy: 'user' },
      { type: 'beta_test_recorded', date: '2026-05-29', resultStatus: 'repeat_needed', hcgValue: 18 },
    ]);

    expect(state.confirmedPhase).toBe('beta_followup');
  });

  it('keeps two-week wait after transfer before beta result', () => {
    const state = reduceCycleState([
      { type: 'embryo_transfer_done', date: '2026-05-19', confirmedBy: 'clinic_note' },
      { type: 'beta_test_scheduled', date: '2026-05-29', confirmedBy: 'clinic_note' },
    ]);

    expect(state.confirmedPhase).toBe('two_week_wait');
    expect(state.predictedPhase).toBe('beta_wait');
  });
});
