export const CARD_TYPES = [
  'injection',
  'medication',
  'clinic_visit',
  'clinic_confirmation',
  'partner_support',
  'record',
  'general_action',
] as const;

export type CardType = (typeof CARD_TYPES)[number];

export type AssignedTo =
  | 'my_action'
  | 'partner_action'
  | 'clinic_confirmation'
  | 'excluded';

export type CareDay =
  | 'onboarding'
  | 'clinic_day'
  | 'injection_day'
  | 'waiting_day'
  | 'routine_day';

export type DisplaySafetyLevel = 'normal' | 'time_sensitive' | 'critical';

export type CareCardStatus =
  | 'confirmed'
  | 'completed'
  | 'dismissed'
  | 'revoked'
  | 'superseded'
  | 'archived';

export type CareActionCard = {
  id: string;
  couple_id: string;
  created_by: string;
  assignee_role: 'primary_user' | 'partner' | 'both';
  card_type: CardType;
  title: string;
  description: string | null;
  source_text: string;
  scheduled_at: string | null;
  care_date: string | null;
  status: CareCardStatus;
  confirmation_required: boolean;
  user_marked_important: boolean;
  partner_visible: boolean;
  revision: number;
};

export type CareContextInput = {
  hasEverCaptured: boolean;
  cards: readonly CareActionCard[];
  now: Date;
  manuallySelectedCareDay?: Extract<CareDay, 'waiting_day'> | null;
};
