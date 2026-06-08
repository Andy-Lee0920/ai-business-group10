import type { createCookieBackedSupabaseClient } from '../../lib/server-supabase';
import type { PartnerSerializableCareActionCard } from './partner-care-card-projection';

export const PARTNER_CARE_CARD_SELECT = [
  'id',
  'assignee_role',
  'card_type',
  'title',
  'description',
  'scheduled_at',
  'care_date',
  'status',
  'confirmation_required',
  'user_marked_important',
  'partner_visible',
  'revision',
].join(',');

const PARTNER_VISIBLE_CARE_CARD_STATUSES = ['confirmed', 'completed', 'revoked', 'superseded'] as const;

type PartnerCareCardReadClient = Pick<Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>, 'from'>;

export type PartnerVisibleCareCardsResult = {
  data: PartnerSerializableCareActionCard[] | null;
  error: unknown;
};

/**
 * Read the canonical care cards that an approved account-based partner may see.
 *
 * Privacy flow:
 * approved partner link supplies linkedPatientId
 * → linked patient/couple scope: app query uses created_by=linkedPatientId, while RLS keeps the couple boundary
 * → care_action_cards scoped by created_by=linkedPatientId
 * → partner_visible=true gate
 * → partner-safe serializer/projection in partner-care-card-projection.ts
 *
 * This intentionally has no schedule_items fallback. schedule_items remains a
 * primary-user legacy compatibility fallback and must not be introduced into
 * partner rendering under refactor.
 */
export async function getPartnerVisibleCareCards(
  supabase: PartnerCareCardReadClient,
  input: { linkedPatientId: string; windowStart: Date; windowEnd: Date },
): Promise<PartnerVisibleCareCardsResult> {
  const result = await supabase
    .from('care_action_cards')
    .select(PARTNER_CARE_CARD_SELECT)
    .eq('created_by', input.linkedPatientId)
    .eq('partner_visible', true)
    .in('status', PARTNER_VISIBLE_CARE_CARD_STATUSES)
    .gte('scheduled_at', input.windowStart.toISOString())
    .lte('scheduled_at', input.windowEnd.toISOString())
    .order('scheduled_at', { ascending: true });

  return {
    data: ((result.data ?? null) as unknown) as PartnerSerializableCareActionCard[] | null,
    error: result.error ?? null,
  };
}
