import type { CareActionCard, CareDay } from './care-cards.types';

export const TREATMENT_MILESTONES = [
  'initial_visit',
  'stimulation_start',
  'trigger_shot',
  'egg_retrieval',
  'embryo_transfer',
  'result_day',
] as const;

export type TreatmentMilestoneKind = (typeof TREATMENT_MILESTONES)[number];

export type TreatmentProtocol = 'long_agonist' | 'antagonist' | 'mini_ivf' | null;

export type TreatmentCycle = {
  id: string;
  couple_id: string;
  cycle_number: number;
  protocol: TreatmentProtocol;
  started_at: string;
  created_at: string;
};

export type TreatmentMilestone = {
  id: string;
  cycle_id: string;
  couple_id: string;
  milestone: TreatmentMilestoneKind;
  confirmed_at: string;
  notes: string | null;
  created_at: string;
};

export type TimelineCareDay = Exclude<CareDay, 'onboarding'>;

export type CareSurfaceOverrideReason = 'trigger_shot' | 'procedure_time_gate' | 'none';

export type CareSurfaceContextV2 = {
  phaseCareDay: TimelineCareDay;
  surfaceCareDay: TimelineCareDay;
  foregroundCards: CareActionCard[];
  overrideReason: CareSurfaceOverrideReason;
  proximityDays?: number;
};
