import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeCycleUseWindow, getFeatureGateDecision, isCyclePassActive } from '../../src/domain/cycle-pass';

describe('Cycle Pass freemium gates', () => {
  it('keeps provider payment status inactive without a bounded entitlement snapshot', () => {
    expect(isCyclePassActive({ userId: 'user-1', cycleId: 'cycle-1' })).toBe(false);
  });

  it('activates only for the matching user and cycle inside the entitlement window', () => {
    const entitlement = {
      userId: 'user-1',
      cycleId: 'cycle-1',
      status: 'active' as const,
      source: 'manual_code' as const,
      activeFrom: '2026-05-01',
      activeUntil: '2026-06-30',
    };

    expect(isCyclePassActive({ userId: 'user-1', cycleId: 'cycle-1', entitlement, now: new Date('2026-05-20T00:00:00.000Z') })).toBe(true);
    expect(isCyclePassActive({ userId: 'user-2', cycleId: 'cycle-1', entitlement, now: new Date('2026-05-20T00:00:00.000Z') })).toBe(false);
    expect(isCyclePassActive({ userId: 'user-1', cycleId: 'cycle-1', entitlement, now: new Date('2026-07-01T00:00:00.000Z') })).toBe(false);
  });

  it('gates premium cycle surfaces while leaving basic execution free', () => {
    expect(getFeatureGateDecision({ feature: 'clinicday_deep_history', cyclePassActive: false, careDay: 'clinic_day' })).toMatchObject({ allowed: false, requiredPlan: 'cycle_pass' });
    expect(getFeatureGateDecision({ feature: 'routine_medication_cards', cyclePassActive: false, careDay: 'routine_day' })).toMatchObject({ allowed: true, requiredPlan: 'free' });
    expect(getFeatureGateDecision({ feature: 'two_week_wait_partner_emotional_mode', cyclePassActive: true, careDay: 'two_week_wait_day' })).toMatchObject({ allowed: true, requiredPlan: 'cycle_pass' });
    expect(getFeatureGateDecision({ feature: 'cycle_timeline_export', cyclePassActive: true, cycleActive: false, careDay: 'routine_day' })).toMatchObject({ allowed: false, reason: 'cycle_inactive' });
  });

  it('always bypasses gates for Result Protection Mode', () => {
    expect(getFeatureGateDecision({ feature: 'cycle_review_export', cyclePassActive: false, careDay: 'result_protection_day' })).toMatchObject({
      allowed: true,
      requiredPlan: 'free',
      reason: 'result_protection_always_free',
    });
  });

  it('documents freemium boundary and deferred payment provider decision', () => {
    const doc = readFileSync('docs/01-product/cycle-pass-freemium-boundary.md', 'utf8');
    const migration = readFileSync('supabase/migrations/202605290003_cycle_pass_entitlements.sql', 'utf8');

    expect(doc).toContain('Cycle 단위 unlock');
    expect(doc).toContain('Provider decision: HITL');
    expect(doc).toContain('cycle_pass_entitlements');
    expect(doc).toContain('Result Protection Mode is always free');
    expect(doc).toContain('기본 리마인더, 약물 카드, 파트너 연결은 무료');
    expect(doc).toContain('Authenticated clients may read their own entitlement only');
    expect(migration).toContain('create table if not exists public.cycle_pass_entitlements');
    expect(migration).toContain('provider_reference_hash');
    expect(migration).toContain('grant select on public.cycle_pass_entitlements to authenticated');
    expect(migration).toContain('grant select, insert, update, delete on public.cycle_pass_entitlements to service_role');
    expect(migration).not.toMatch(/grant\s+select,\s*insert,\s*update\s+on\s+public\.cycle_pass_entitlements\s+to\s+authenticated/iu);
    expect(migration).not.toMatch(/for\s+insert|for\s+update/iu);
    expect(migration).not.toMatch(/payment_secret|raw_payment|card_number/iu);
  });

  it('bounds intensive use to one active treatment-cycle window', () => {
    expect(computeCycleUseWindow({
      startedAt: '2026-05-01',
      now: new Date('2026-05-20T00:00:00.000Z'),
    })).toMatchObject({ active: true, startsAt: '2026-05-01', endsAt: '2026-07-30', reason: 'active_cycle' });

    expect(computeCycleUseWindow({
      startedAt: '2026-05-01',
      resultDay: '2026-05-28',
      now: new Date('2026-06-12T00:00:00.000Z'),
    })).toMatchObject({ active: false, endsAt: '2026-06-11', reason: 'cycle_expired' });
  });
});
