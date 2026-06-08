import { createHash, randomBytes } from 'node:crypto';
import type { CareActionCard, CareCardStatus } from '../types/care-cards.types';
import { translateCareCardToPartnerRole } from '../domain/partner-role-projection';
import {
  PARTNER_VIEW_ITEM_FIELDS,
  type PartnerActionViewItem,
  type PartnerDisplayState,
  type PartnerShareLinkRecord,
} from '../types/partner-view.types';

export { PARTNER_VIEW_ITEM_FIELDS };
export type { PartnerActionViewItem, PartnerShareLinkRecord };

type PartnerSerializableCareActionCard = Pick<
  CareActionCard,
  | 'id'
  | 'assignee_role'
  | 'card_type'
  | 'title'
  | 'description'
  | 'scheduled_at'
  | 'care_date'
  | 'status'
  | 'confirmation_required'
  | 'user_marked_important'
  | 'partner_visible'
  | 'revision'
>;

export function serializePartnerViewCards(cards: readonly PartnerSerializableCareActionCard[]): PartnerActionViewItem[] {
  return cards.filter(isPartnerVisible).map(toPartnerItem);
}

export function createPartnerShareToken() {
  return randomBytes(32).toString('base64url');
}

export function hashPartnerShareToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function expiresSevenDaysFrom(now: Date) {
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function isPartnerLinkUsable(link: PartnerShareLinkRecord | null | undefined, now: Date) {
  if (!link) return false;
  if (link.revoked_at) return false;
  return new Date(link.expires_at).getTime() > now.getTime();
}

function isPartnerVisible(card: PartnerSerializableCareActionCard) {
  return card.partner_visible && card.status !== 'archived' && card.status !== 'dismissed';
}

function toPartnerItem(card: PartnerSerializableCareActionCard): PartnerActionViewItem {
  const displayState = displayStateForStatus(card.status);
  const roleProjection = translateCareCardToPartnerRole({
    card_type: card.card_type,
    title: card.title,
    description: card.description,
    display_state: displayState,
  });

  return {
    safe_id: safePartnerItemId(card.id),
    title: card.title,
    scheduled_at: card.scheduled_at,
    card_type: card.card_type,
    description: card.description,
    display_state: displayState,
    sync_revision: card.revision,
    ...roleProjection,
  };
}

export function safePartnerItemId(input: string) {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function displayStateForStatus(status: CareCardStatus): PartnerDisplayState {
  if (status === 'revoked') return 'revoked';
  if (status === 'superseded') return 'superseded';
  if (status === 'completed') return 'completed';
  return 'current';
}
