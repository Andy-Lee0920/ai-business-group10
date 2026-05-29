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
  now?: Date;
  entitlement?: CyclePassEntitlement | null;
};

export type FeatureGateInput = {
  feature: CyclePassFeature;
  cyclePassActive: boolean;
  cycleActive?: boolean;
  careDay: TimelineCareDay;
};

export type FeatureGateDecision = {
  allowed: boolean;
  requiredPlan: 'free' | 'cycle_pass';
  reason: 'free_core' | 'paid_feature' | 'cycle_pass_active' | 'cycle_inactive' | 'result_protection_always_free';
};

const FREE_FEATURES = new Set<CyclePassFeature>(['routine_medication_cards', 'partner_connection']);
const DEFAULT_ACTIVE_CYCLE_DAYS = 90;
const RESULT_REVIEW_DAYS = 14;

export type CyclePassEntitlement = {
  cycleId: string;
  userId: string;
  status: 'active' | 'expired' | 'revoked';
  source: 'manual_code' | 'provider' | 'admin';
  activeFrom: string;
  activeUntil: string;
  revokedAt?: string | null;
};

export type CycleUseWindowInput = {
  startedAt: string;
  resultDay?: string | null;
  now?: Date;
};

export type CycleUseWindow = {
  active: boolean;
  startsAt: string;
  endsAt: string;
  reason: 'active_cycle' | 'before_cycle' | 'cycle_expired';
};

export function isCyclePassActive(input: CyclePassLookupInput): boolean {
  const entitlement = input.entitlement;
  if (!entitlement) return false;
  if (entitlement.status !== 'active' || entitlement.revokedAt) return false;
  if (entitlement.cycleId !== input.cycleId || entitlement.userId !== input.userId) return false;

  const now = input.now ?? new Date();
  return isWithinInclusiveDateWindow(now, entitlement.activeFrom, entitlement.activeUntil);
}

export function computeCycleUseWindow(input: CycleUseWindowInput): CycleUseWindow {
  const now = input.now ?? new Date();
  const startsAt = input.startedAt;
  const endsAt = input.resultDay
    ? addDays(input.resultDay, RESULT_REVIEW_DAYS)
    : addDays(input.startedAt, DEFAULT_ACTIVE_CYCLE_DAYS);

  if (dateKey(now) < startsAt) return { active: false, startsAt, endsAt, reason: 'before_cycle' };
  if (dateKey(now) > endsAt) return { active: false, startsAt, endsAt, reason: 'cycle_expired' };
  return { active: true, startsAt, endsAt, reason: 'active_cycle' };
}

export function getFeatureGateDecision(input: FeatureGateInput): FeatureGateDecision {
  if (input.careDay === 'result_protection_day') {
    return { allowed: true, requiredPlan: 'free', reason: 'result_protection_always_free' };
  }

  if (FREE_FEATURES.has(input.feature)) {
    return { allowed: true, requiredPlan: 'free', reason: 'free_core' };
  }

  if (input.cycleActive === false) {
    return { allowed: false, requiredPlan: 'cycle_pass', reason: 'cycle_inactive' };
  }

  if (input.cyclePassActive) {
    return { allowed: true, requiredPlan: 'cycle_pass', reason: 'cycle_pass_active' };
  }

  return { allowed: false, requiredPlan: 'cycle_pass', reason: 'paid_feature' };
}

function isWithinInclusiveDateWindow(now: Date, from: string, until: string) {
  const current = dateKey(now);
  return current >= from && current <= until;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}
