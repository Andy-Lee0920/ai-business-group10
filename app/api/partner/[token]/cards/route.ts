import { NextResponse } from 'next/server';
import { CARD_TYPES } from '../../../../../src/types/care-cards.types';
import type { PartnerActionViewItem, PartnerDisplayState } from '../../../../../src/types/partner-view.types';
import { hashPartnerShareToken } from '../../../../../src/services/partner-view';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { translateCareCardToPartnerRole } from '../../../../../src/domain/partner-role-projection';
import { projectPartnerItemsBySharingScope, type PatientSharingScope } from '../../../../../src/domain/care-os-architecture';

const CARD_TYPE_SET = new Set<string>(CARD_TYPES);

type PartnerRpcRow = {
  safe_id: string;
  scheduled_at: string | null;
  card_type: string;
  display_state: string;
  revision?: number | null;
  sharing_scope?: string | null;
};

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const tokenHash = hashPartnerShareToken(token);
  const { data: usable, error: usableError } = await supabase.rpc('is_partner_share_link_usable', {
    p_token_hash: tokenHash,
  });

  if (usableError || usable !== true) {
    return NextResponse.json({ error: 'partner_link_not_found' }, { status: 404 });
  }

  const { data, error } = await supabase.rpc('get_partner_action_view', { p_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'partner_link_unavailable' }, { status: 404 });

  return NextResponse.json(
    { items: toScopedPartnerItems(parsePartnerRows(data)) },
    {
      headers: {
        'cache-control': 'no-store',
        'x-fevio-sync-strategy': 'polling',
      },
    },
  );
}

function toScopedPartnerItems(rows: readonly PartnerRpcRow[]): PartnerActionViewItem[] {
  const items = rows.map(toPartnerItem).filter((item) => item !== null);
  const scope = normalizeSharingScope(rows.find((row) => normalizeSharingScope(row.sharing_scope) !== 'care')?.sharing_scope);
  return projectPartnerItemsBySharingScope(items, scope);
}

function toPartnerItem(row: PartnerRpcRow): PartnerActionViewItem | null {
  if (!isCardType(row.card_type) || !isDisplayState(row.display_state)) return null;
  const roleProjection = translateCareCardToPartnerRole({
    card_type: row.card_type,
    display_state: row.display_state,
  });
  return {
    safe_id: row.safe_id,
    scheduled_at: row.scheduled_at,
    card_type: row.card_type,
    display_state: row.display_state,
    sync_revision: typeof row.revision === 'number' && row.revision > 0 ? row.revision : 1,
    ...roleProjection,
  };
}

function isCardType(value: string): value is PartnerActionViewItem['card_type'] {
  return CARD_TYPE_SET.has(value);
}

function isDisplayState(value: string): value is PartnerDisplayState {
  return ['current', 'new', 'changed_since_ack', 'revoked', 'superseded', 'completed'].includes(value);
}

function normalizeSharingScope(value: unknown): PatientSharingScope {
  return value === 'basic' || value === 'emotional' || value === 'care' ? value : 'care';
}

function parsePartnerRows(value: unknown): PartnerRpcRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const scheduledAt = item.scheduled_at;
    const cardType = item.card_type;
    const displayState = item.display_state;
    const safeId = item.safe_id;
    const revision = item.revision;
    const sharingScope = item.sharing_scope;

    if (typeof cardType !== 'string') return [];
    if (typeof displayState !== 'string') return [];
    if (scheduledAt !== null && typeof scheduledAt !== 'string') return [];
    if (typeof safeId !== 'string') return [];
    if (revision !== undefined && revision !== null && typeof revision !== 'number') return [];
    if (sharingScope !== undefined && sharingScope !== null && typeof sharingScope !== 'string') return [];

    return [{
      safe_id: safeId,
      scheduled_at: scheduledAt,
      card_type: cardType,
      display_state: displayState,
      revision,
      sharing_scope: sharingScope,
    }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
