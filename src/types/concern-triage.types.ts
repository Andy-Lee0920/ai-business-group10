import type { CardType } from './care-cards.types';
import type { CareSurfaceComposition } from './care-surface.types';
import type { IvfStage, OnboardingCareDay } from '../domain/onboarding-care-state';

export type ConcernTriageIntent =
  | 'injection_timing_anxiety'
  | 'dose_change_doubt'
  | 'clinic_question'
  | 'partner_sharing_hesitation'
  | 'reminder_preference'
  | 'care_navigation'
  | 'crisis_support';

export type ConcernSummaryTemplateId =
  | 'today_card_time_check'
  | 'dose_confirm_route'
  | 'clinic_question_prepare'
  | 'partner_role_boundary'
  | 'reminder_strength_choice'
  | 'care_route_overview'
  | 'operator_static_support';

export type ConcernActionId =
  | 'view_today_cards'
  | 'route_add_medication'
  | 'route_clinic_update'
  | 'route_records_questions'
  | 'route_partner_settings'
  | 'choose_reminder_strength'
  | 'show_operator_support';

export type ReminderStrength = 'strong' | 'quiet';

export type ConcernTriageCardMetadata = {
  card_id: string;
  type: Extract<CardType, 'injection' | 'medication' | 'clinic_visit' | 'clinic_confirmation' | 'general_action' | 'partner_support'>;
  scheduled_at: string | null;
  reminder_status: 'enabled' | 'disabled' | 'none';
  display_safety_level?: string | null;
};

export type ConcernTriageInput = {
  utterance: string;
  confirmedPhase: IvfStage | null;
  phaseCareDay: OnboardingCareDay;
  todayCards: readonly ConcernTriageCardMetadata[];
  previousSignalTags: readonly ConcernTriageIntent[];
  partnerConnected: boolean;
};

export type ConcernTriageResult = {
  intent: ConcernTriageIntent;
  summary_template_id: ConcernSummaryTemplateId;
  action_ids: ConcernActionId[];
  related_card_id: string | null;
  should_persist_signal: boolean;
};

export type CareAgentReadSurfaceProjection = Pick<CareSurfaceComposition, 'slots' | 'intensity' | 'suppressedSlots' | 'appliedRules'> & {
  component_registry: 'CareSurfaceComponent';
};

