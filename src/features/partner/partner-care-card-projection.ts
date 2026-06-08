import { createHash } from 'node:crypto';
import { translateCareCardToPartnerRole } from '../../domain/partner-role-projection';
import type { CareActionCard, CareCardStatus } from '../../types/care-cards.types';
import {
  PARTNER_VIEW_ITEM_FIELDS,
  type PartnerActionViewItem,
  type PartnerDisplayState,
} from '../../types/partner-view.types';

export { PARTNER_VIEW_ITEM_FIELDS };

export type PartnerSerializableCareActionCard = Pick<
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

/**
 * Partner-only care-card projection.
 *
 * Do not replace this with the patient/home projection: partner payloads have a
 * narrower trust boundary and must not inherit source_text, created_by,
 * schedule_items fallback fields, or patient-only action state. Raw clinical
 * text cannot leak because this serializer only accepts the explicit
 * PartnerSerializableCareActionCard shape and emits PARTNER_VIEW_ITEM_FIELDS.
 */
export function serializePartnerViewCards(cards: readonly PartnerSerializableCareActionCard[]): PartnerActionViewItem[] {
  return projectPartnerSafeCareCards(cards);
}

export function projectPartnerSafeCareCards(cards: readonly PartnerSerializableCareActionCard[]): PartnerActionViewItem[] {
  return cards.filter(isPartnerVisible).map(toPartnerItem);
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
