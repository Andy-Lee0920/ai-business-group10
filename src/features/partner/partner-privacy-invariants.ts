/**
 * Partner care-card privacy boundary.
 *
 * Flow map:
 * approved partner link
 * → scoped care_action_cards where partner_visible=true
 * → partner-only projection
 * → sanitized partner cards
 *
 * This boundary intentionally does not reuse patient/home projection helpers.
 * Patient helpers may carry raw clinical text or legacy compatibility concerns
 * that are not safe defaults for the account-based partner surface.
 */
export const PARTNER_CARE_CARD_READ_FLOW = [
  'approved_partner_link',
  'scoped_care_action_cards',
  'partner_visible_true',
  'partner_only_projection',
  'sanitized_partner_cards',
] as const;

export const PARTNER_PRIVACY_INVARIANTS = {
  noPatientProjectionReuse: 'Partner payloads use a partner-only projection, not the patient/home projection.',
  noRawClinicalText: 'Raw clinical source text is never part of the partner card select or payload.',
  noLegacyScheduleFallback: 'Partner rendering reads canonical care_action_cards only; schedule_items fallback remains a primary-user compatibility path.',
  noForcedSharing: 'Only user-confirmed partner_visible=true cards can enter the partner projection.',
} as const;
