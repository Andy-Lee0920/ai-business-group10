import type { CareSurfaceOverrideReason, TimelineCareDay } from './treatment-timeline.types';

export type CareSurfaceSlot =
  | 'hero'
  | 'primary_card'
  | 'secondary_card'
  | 'stats_row'
  | 'checklist'
  | 'partner';

export type CareSurfaceComponent =
  | 'CareMomentRing'
  | 'CompactHeroGreeting'
  | 'MissionCardPair'
  | 'QuickStatRow'
  | 'QuietChecklist'
  | 'PartnerConnectBar'
  | null;

export type CareSurfaceConditionOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'exists';

export type CareSurfacePhase = 'injection' | 'clinic' | 'waiting' | 'routine';

export type PartnerSurfaceUrgencyTier = 'critical' | 'elevated' | 'routine' | 'quiet';

export interface FevioSurfaceContext {
  careDay: TimelineCareDay;
  overrideReason?: CareSurfaceOverrideReason;
  proximityDays?: number;
  emotionTrend?: 'declining' | 'stable' | 'rising';
  cardCount: number;
  partnerStatus?: 'connected' | 'seen' | 'unknown';
}

export interface CareSurfaceCondition {
  field: keyof FevioSurfaceContext;
  op: CareSurfaceConditionOperator;
  value: string | number | boolean | null;
}

export interface CareSurfaceRule {
  id: string;
  slot: CareSurfaceSlot;
  component: CareSurfaceComponent;
  conditions: CareSurfaceCondition[];
  priority: number;
  intensity: number;
  momentCopy?: string;
  userExplanation?: string;
}

export interface CareSurfaceTraceEntry {
  ruleId: string;
  slot: CareSurfaceSlot;
  matched: boolean;
  selected: boolean;
  specificity: number;
  priority: number;
  intensity: number;
}

export interface CareSurfaceComposition {
  slots: Record<CareSurfaceSlot, CareSurfaceComponent>;
  intensity: number;
  suppressedSlots: CareSurfaceSlot[];
  appliedRules: string[];
  momentCopy?: string;
  trace: CareSurfaceTraceEntry[];
}

export interface PartnerSurfaceSignal {
  urgencyTier: PartnerSurfaceUrgencyTier;
  intensity: number;
  phase: CareSurfacePhase;
  momentCopy: string;
}
