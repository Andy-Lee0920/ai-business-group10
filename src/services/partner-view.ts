import { createHash, randomBytes } from 'node:crypto';
import type { PartnerActionViewItem, PartnerShareLinkRecord } from '../types/partner-view.types';

export {
  PARTNER_VIEW_ITEM_FIELDS,
  projectPartnerSafeCareCards,
  safePartnerItemId,
  serializePartnerViewCards,
  type PartnerSerializableCareActionCard,
} from '../features/partner/partner-care-card-projection';
export type { PartnerActionViewItem, PartnerShareLinkRecord };

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
