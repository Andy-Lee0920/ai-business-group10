import type { TimelineCareDay } from '../types/treatment-timeline.types';

export type CyclePassFeature =
  | 'routine_medication_cards'
  | 'partner_connection'
  | 'clinicday_deep_history'
  | 'cycle_timeline_export'
  | 'cycle_review_export'
  | 'two_week_wait_partner_emotional_mode';

export type CyclePassLookupInput = {
  userId: string;
  cycleId: string;
};

export type FeatureGateInput = {
  feature: CyclePassFeature;
  cyclePassActive: boolean;
  careDay: TimelineCareDay;
};

export type FeatureGateDecision = {
  allowed: boolean;
  requiredPlan: 'free' | 'cycle_pass';
  reason: 'free_core' | 'paid_feature' | 'cycle_pass_active' | 'result_protection_always_free';
};

const FREE_FEATURES = new Set<CyclePassFeature>(['routine_medication_cards', 'partner_connection']);

/**
 * Provider decision: HITL.
 * This returns false until the payment provider and entitlement source are chosen.
 */
export function isCyclePassActive(_input: CyclePassLookupInput): boolean {
  return false;
}

export function getFeatureGateDecision(input: FeatureGateInput): FeatureGateDecision {
  if (input.careDay === 'result_protection_day') {
    return { allowed: true, requiredPlan: 'free', reason: 'result_protection_always_free' };
  }

  if (FREE_FEATURES.has(input.feature)) {
    return { allowed: true, requiredPlan: 'free', reason: 'free_core' };
  }

  if (input.cyclePassActive) {
    return { allowed: true, requiredPlan: 'cycle_pass', reason: 'cycle_pass_active' };
  }

  return { allowed: false, requiredPlan: 'cycle_pass', reason: 'paid_feature' };
}
