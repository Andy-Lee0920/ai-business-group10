import { createHash, randomBytes } from 'node:crypto';
import type { CareActionCard, CareCardStatus } from '../types/care-cards.types';
import {
  PARTNER_VIEW_ITEM_FIELDS,
  type PartnerActionViewItem,
  type PartnerDisplayState,
  type PartnerShareLinkRecord,
} from '../types/partner-view.types';

export { PARTNER_VIEW_ITEM_FIELDS };
export type { PartnerActionViewItem, PartnerShareLinkRecord };

export function serializePartnerViewCards(cards: readonly CareActionCard[]): PartnerActionViewItem[] {
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

function isPartnerVisible(card: CareActionCard) {
  return card.partner_visible && card.status !== 'archived' && card.status !== 'dismissed';
}

function toPartnerItem(card: CareActionCard): PartnerActionViewItem {
  return {
    title: card.title,
    scheduled_at: card.scheduled_at,
    card_type: card.card_type,
    description: card.description,
    display_state: displayStateForStatus(card.status),
  };
}

function displayStateForStatus(status: CareCardStatus): PartnerDisplayState {
  if (status === 'revoked') return 'revoked';
  if (status === 'superseded') return 'superseded';
  if (status === 'completed') return 'completed';
  return 'current';
}
