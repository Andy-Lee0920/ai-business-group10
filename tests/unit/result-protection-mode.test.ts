import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildResultProtectionSurface, isForbiddenResultProtectionCopy } from '../../src/domain/result-protection';
import { careDayForConfirmedPhase, reduceCycleState } from '../../src/domain/cycle-state-machine';

describe('Result Protection Mode', () => {
  it('routes a negative beta result into a protected always-free care surface', () => {
    const state = reduceCycleState([
      { type: 'embryo_transfer_done', date: '2026-05-19', confirmedBy: 'clinic_note' },
      { type: 'beta_test_recorded', date: '2026-05-29', resultStatus: 'negative', hcgValue: 0 },
    ]);
    const surface = buildResultProtectionSurface({ betaRecordedAt: '2026-05-29', now: '2026-05-29' });

    expect(state.confirmedPhase).toBe('result_protection');
    expect(careDayForConfirmedPhase(state.confirmedPhase)).toBe('result_protection_day');
    expect(surface).toMatchObject({
      careDay: 'result_protection_day',
      isAlwaysFree: true,
      quietNonMedicationNotifications: true,
      allowRoutineMedicationReminders: true,
      reviewVisibility: 'hidden_until_user_opens',
    });
    expect(surface.heroCopy).toContain('오늘은 아무것도 결정하지 않아도');
  });

  it('keeps cycle review hidden until the user explicitly opens it', () => {
    expect(buildResultProtectionSurface({ betaRecordedAt: '2026-05-29', now: '2026-05-30' }).reviewVisibility).toBe('hidden_until_user_opens');
    expect(buildResultProtectionSurface({ betaRecordedAt: '2026-05-29', now: '2026-05-30', reviewOpenedAt: '2026-05-31T10:00:00.000Z' }).reviewVisibility).toBe('open_by_user_request');
  });

  it('forbids next-cycle push and blame-oriented copy', () => {
    const surface = buildResultProtectionSurface({ betaRecordedAt: '2026-05-29', now: '2026-05-29' });
    const body = JSON.stringify(surface);

    expect(isForbiddenResultProtectionCopy(body)).toBe(false);
    expect(body).not.toMatch(/다음 cycle|다음 주기 준비|실패 원인|바로 다시|내 몸이/u);
  });

  it('adds protected cycle outcome columns without anon access', () => {
    const migration = readFileSync('supabase/migrations/202605120005_result_protection_mode.sql', 'utf8');
    const matrix = readFileSync('docs/03-engineering/schema-rls-matrix.md', 'utf8');

    expect(migration).toContain('cycle_outcome');
    expect(migration).toContain('result_protection_started_at');
    expect(migration).toContain('result_review_opened_at');
    expect(migration).toContain('quiet_until');
    expect(migration).not.toContain('grant select, insert, update on public.treatment_cycles to anon');
    expect(matrix).toContain('Result Protection Mode is always free');
  });
});
