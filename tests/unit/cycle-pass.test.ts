import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getFeatureGateDecision, isCyclePassActive } from '../../src/domain/cycle-pass';

describe('Cycle Pass freemium gates', () => {
  it('keeps provider payment status behind a HITL stub', () => {
    expect(isCyclePassActive({ userId: 'user-1', cycleId: 'cycle-1' })).toBe(false);
  });

  it('gates premium cycle surfaces while leaving basic execution free', () => {
    expect(getFeatureGateDecision({ feature: 'clinicday_deep_history', cyclePassActive: false, careDay: 'clinic_day' })).toMatchObject({ allowed: false, requiredPlan: 'cycle_pass' });
    expect(getFeatureGateDecision({ feature: 'routine_medication_cards', cyclePassActive: false, careDay: 'routine_day' })).toMatchObject({ allowed: true, requiredPlan: 'free' });
    expect(getFeatureGateDecision({ feature: 'two_week_wait_partner_emotional_mode', cyclePassActive: true, careDay: 'two_week_wait_day' })).toMatchObject({ allowed: true, requiredPlan: 'cycle_pass' });
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

    expect(doc).toContain('Cycle 단위 unlock');
    expect(doc).toContain('Provider decision: HITL');
    expect(doc).toContain('Result Protection Mode is always free');
    expect(doc).toContain('기본 리마인더, 약물 카드, 파트너 연결은 무료');
  });
});
