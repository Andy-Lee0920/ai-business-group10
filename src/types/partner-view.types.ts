import type { CardType } from './care-cards.types';

export const PARTNER_VIEW_ITEM_FIELDS = [
  'safe_id',
  'title',
  'scheduled_at',
  'card_type',
  'description',
  'display_state',
  'sync_revision',
  'partner_role',
  'partner_action',
  'avoid_prompt',
  'visibility',
] as const;

export type PartnerDisplayState =
  | 'current'
  | 'new'
  | 'changed_since_ack'
  | 'revoked'
  | 'superseded'
  | 'completed';

export type PartnerActionViewItem = {
  safe_id: string;
  title: string;
  scheduled_at: string | null;
  card_type: CardType;
  description: string | null;
  display_state: PartnerDisplayState;
  sync_revision: number;
  partner_role: string;
  partner_action: string;
  avoid_prompt: string;
  visibility: 'partner_safe' | 'private_summary';
};

export type PartnerShareLinkRecord = {
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

export type PartnerViewPayload = {
  items: PartnerActionViewItem[];
};
