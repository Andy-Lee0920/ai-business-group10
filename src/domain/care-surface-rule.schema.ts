import { z } from 'zod';

export const CareSurfaceSlotSchema = z.enum(['hero', 'primary_card', 'secondary_card', 'stats_row', 'checklist', 'partner']);
export const CareSurfaceComponentSchema = z.enum([
  'CareMomentRing',
  'CompactHeroGreeting',
  'MissionCardPair',
  'QuickStatRow',
  'QuietChecklist',
  'PartnerConnectBar',
]).nullable();
export const CareSurfaceConditionFieldSchema = z.enum(['careDay', 'overrideReason', 'proximityDays', 'emotionTrend', 'cardCount', 'partnerStatus']);
export const CareSurfaceConditionOperatorSchema = z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'exists']);

export const CareSurfaceConditionSchema = z.object({
  field: CareSurfaceConditionFieldSchema,
  op: CareSurfaceConditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

export const CareSurfaceRuleSchema = z.object({
  id: z.string().min(1),
  slot: CareSurfaceSlotSchema,
  component: CareSurfaceComponentSchema,
  conditions: z.array(CareSurfaceConditionSchema),
  priority: z.number().int().positive(),
  intensity: z.number().min(0).max(1),
  momentCopy: z.string().optional(),
  userExplanation: z.string().optional(),
});

export const CareSurfaceRulesSchema = z.array(CareSurfaceRuleSchema);
