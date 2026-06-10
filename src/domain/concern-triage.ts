import { runDeterministicModerationFilter, type ModerationFilterRule } from './community-moderation';
import { computeCareSurface } from './care-surface-engine';
import type { FevioSurfaceContext } from '../types/care-surface.types';
import type {
  CareAgentReadSurfaceProjection,
  ConcernActionId,
  ConcernSummaryTemplateId,
  ConcernTriageCardMetadata,
  ConcernTriageInput,
  ConcernTriageIntent,
  ConcernTriageResult,
  ReminderStrength,
} from '../types/concern-triage.types';

const CRISIS_RULES: ModerationFilterRule[] = [
  { ruleType: 'keyword', pattern: '죽고 싶', severity: 'high', active: true },
  { ruleType: 'keyword', pattern: '자해', severity: 'high', active: true },
  { ruleType: 'keyword', pattern: '극단적', severity: 'high', active: true },
  { ruleType: 'regex', pattern: 'suicide|self[- ]?harm', severity: 'high', active: true },
];

export function classifyConcernTriage(input: ConcernTriageInput): ConcernTriageResult {
  if (hasCrisisSignal(input.utterance)) {
    return {
      intent: 'crisis_support',
      summary_template_id: 'operator_static_support',
      action_ids: ['show_operator_support'],
      related_card_id: null,
      should_persist_signal: false,
    };
  }

  const intent = inferIntent(input);
  return {
    intent,
    summary_template_id: summaryTemplateForIntent(intent),
    action_ids: actionsForIntent(intent),
    related_card_id: relatedCardIdForIntent(intent, input.todayCards),
    should_persist_signal: true,
  };
}

export function projectCareAgentReadSurface(input: {
  confirmedPhase: ConcernTriageInput['confirmedPhase'];
  phaseCareDay: ConcernTriageInput['phaseCareDay'];
  cardCount: number;
  partnerConnected: boolean;
}): CareAgentReadSurfaceProjection {
  const context: FevioSurfaceContext = {
    careDay: input.phaseCareDay,
    overrideReason: input.confirmedPhase === 'ovarian_stimulation' ? 'trigger_shot' : undefined,
    proximityDays: 0,
    cardCount: input.cardCount,
    partnerStatus: input.partnerConnected ? 'connected' : 'unknown',
  };
  const surface = computeCareSurface(context);

  return {
    component_registry: 'CareSurfaceComponent',
    slots: surface.slots,
    intensity: surface.intensity,
    suppressedSlots: surface.suppressedSlots,
    appliedRules: surface.appliedRules,
  };
}

export function recommendReminderStrength(card: ConcernTriageCardMetadata): {
  recommended_strength: ReminderStrength;
  reason: 'card_type_default';
  display_safety_level: string | null;
} {
  return {
    recommended_strength: card.type === 'injection' ? 'strong' : 'quiet',
    reason: 'card_type_default',
    display_safety_level: card.display_safety_level ?? null,
  };
}

function hasCrisisSignal(utterance: string) {
  return runDeterministicModerationFilter(utterance, CRISIS_RULES).status === 'pending';
}

function inferIntent(input: ConcernTriageInput): ConcernTriageIntent {
  const text = input.utterance.toLowerCase();
  if (/알림|소리|조용|강하게|리마인/u.test(text)) return 'reminder_preference';
  if (/파트너|남편|공유|같이/u.test(text)) return 'partner_sharing_hesitation';
  if (/병원|질문|물어|확인해달/u.test(text)) return 'clinic_question';
  if (/용량|단위|몇\s*(mg|mcg|iu|ml|정|회)|dose/u.test(text)) return 'dose_change_doubt';
  if (/주사|시간|맞는|복약|약/u.test(text)) return 'injection_timing_anxiety';
  return input.previousSignalTags[0] ?? 'care_navigation';
}

function summaryTemplateForIntent(intent: ConcernTriageIntent): ConcernSummaryTemplateId {
  switch (intent) {
    case 'injection_timing_anxiety':
      return 'today_card_time_check';
    case 'dose_change_doubt':
      return 'dose_confirm_route';
    case 'clinic_question':
      return 'clinic_question_prepare';
    case 'partner_sharing_hesitation':
      return 'partner_role_boundary';
    case 'reminder_preference':
      return 'reminder_strength_choice';
    case 'crisis_support':
      return 'operator_static_support';
    case 'care_navigation':
      return 'care_route_overview';
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

function actionsForIntent(intent: ConcernTriageIntent): ConcernActionId[] {
  switch (intent) {
    case 'injection_timing_anxiety':
      return ['view_today_cards', 'route_add_medication', 'choose_reminder_strength'];
    case 'dose_change_doubt':
      return ['route_add_medication', 'route_clinic_update'];
    case 'clinic_question':
      return ['route_clinic_update', 'route_records_questions'];
    case 'partner_sharing_hesitation':
      return ['route_partner_settings', 'route_clinic_update'];
    case 'reminder_preference':
      return ['choose_reminder_strength', 'view_today_cards'];
    case 'crisis_support':
      return ['show_operator_support'];
    case 'care_navigation':
      return ['view_today_cards', 'route_add_medication', 'route_clinic_update'];
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

function relatedCardIdForIntent(intent: ConcernTriageIntent, cards: readonly ConcernTriageCardMetadata[]) {
  if (intent === 'injection_timing_anxiety') return cards.find((card) => card.type === 'injection')?.card_id ?? null;
  if (intent === 'dose_change_doubt') return cards.find((card) => card.type === 'medication' || card.type === 'injection')?.card_id ?? null;
  if (intent === 'clinic_question') return cards.find((card) => card.type === 'clinic_visit' || card.type === 'clinic_confirmation')?.card_id ?? null;
  return null;
}

