import type { CardType } from './care-cards.types';

export const PARTNER_VIEW_ITEM_FIELDS = [
  'title',
  'scheduled_at',
  'card_type',
  'description',
  'display_state',
] as const;

export type PartnerDisplayState =
  | 'current'
  | 'new'
  | 'changed_since_ack'
  | 'revoked'
  | 'superseded'
  | 'completed';

export type PartnerActionViewItem = {
  title: string;
  scheduled_at: string | null;
  card_type: CardType;
  description: string | null;
  display_state: PartnerDisplayState;
};

export type PartnerShareLinkRecord = {
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

export type PartnerViewPayload = {
  items: PartnerActionViewItem[];
};
