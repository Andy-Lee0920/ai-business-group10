import rawRules from '../../config/care-surface-rules.json';
import { CareSurfaceRulesSchema } from './care-surface-rule.schema';
import type {
  CareSurfaceComposition,
  CareSurfaceComponent,
  CareSurfaceCondition,
  CareSurfaceRule,
  CareSurfaceSlot,
  CareSurfaceTraceEntry,
  FevioSurfaceContext,
} from '../types/care-surface.types';

const DEFAULT_SLOTS: Record<CareSurfaceSlot, CareSurfaceComponent> = {
  hero: 'CompactHeroGreeting',
  primary_card: 'MissionCardPair',
  secondary_card: null,
  stats_row: 'QuickStatRow',
  checklist: 'QuietChecklist',
  partner: 'PartnerConnectBar',
};

export const CARE_SURFACE_RULES = CareSurfaceRulesSchema.parse(rawRules) satisfies readonly CareSurfaceRule[];

export function computeCareSurface(
  context: FevioSurfaceContext,
  rules: readonly CareSurfaceRule[] = CARE_SURFACE_RULES,
): CareSurfaceComposition {
  const candidates = rules.filter((rule) => rule.conditions.every((condition) => evalCareSurfaceCondition(context, condition)));
  const sorted = [...candidates].sort(compareRuleSpecificity);
  const slotWinners = new Map<CareSurfaceSlot, CareSurfaceRule>();

  for (const rule of sorted) {
    if (!slotWinners.has(rule.slot)) slotWinners.set(rule.slot, rule);
  }

  const winningRules = [...slotWinners.values()];
  const appliedRules = winningRules.map((rule) => rule.id);
  const suppressedSlots = [...slotWinners.entries()]
    .filter(([, rule]) => rule.component === null)
    .map(([slot]) => slot);
  const slots = buildSlotMap(slotWinners);
  const intensity = winningRules.length > 0 ? Math.max(0.15, ...winningRules.map((rule) => rule.intensity)) : 0.5;
  const momentCopy = winningRules.find((rule) => typeof rule.momentCopy === 'string')?.momentCopy;

  return {
    slots,
    intensity,
    suppressedSlots,
    appliedRules,
    momentCopy,
    trace: buildTrace(rules, candidates, slotWinners),
  };
}

export function evalCareSurfaceCondition(context: FevioSurfaceContext, condition: CareSurfaceCondition): boolean {
  const value = context[condition.field];

  switch (condition.op) {
    case 'eq':
      return value === condition.value;
    case 'neq':
      return value !== condition.value;
    case 'lt':
      return typeof value === 'number' && typeof condition.value === 'number' && value < condition.value;
    case 'lte':
      return typeof value === 'number' && typeof condition.value === 'number' && value <= condition.value;
    case 'gt':
      return typeof value === 'number' && typeof condition.value === 'number' && value > condition.value;
    case 'gte':
      return typeof value === 'number' && typeof condition.value === 'number' && value >= condition.value;
    case 'exists':
      return value !== undefined && value !== null;
    default: {
      const _exhaustive: never = condition.op;
      return _exhaustive;
    }
  }
}

function compareRuleSpecificity(left: CareSurfaceRule, right: CareSurfaceRule) {
  const specificityDelta = right.conditions.length - left.conditions.length;
  if (specificityDelta !== 0) return specificityDelta;
  return left.priority - right.priority;
}

function buildSlotMap(slotWinners: ReadonlyMap<CareSurfaceSlot, CareSurfaceRule>): Record<CareSurfaceSlot, CareSurfaceComponent> {
  const slots = { ...DEFAULT_SLOTS };
  for (const [slot, rule] of slotWinners.entries()) {
    slots[slot] = rule.component;
  }
  return slots;
}

function buildTrace(
  rules: readonly CareSurfaceRule[],
  candidates: readonly CareSurfaceRule[],
  slotWinners: ReadonlyMap<CareSurfaceSlot, CareSurfaceRule>,
): CareSurfaceTraceEntry[] {
  const candidateIds = new Set(candidates.map((rule) => rule.id));
  const selectedIds = new Set([...slotWinners.values()].map((rule) => rule.id));

  return rules.map((rule) => ({
    ruleId: rule.id,
    slot: rule.slot,
    matched: candidateIds.has(rule.id),
    selected: selectedIds.has(rule.id),
    specificity: rule.conditions.length,
    priority: rule.priority,
    intensity: rule.intensity,
  }));
}
