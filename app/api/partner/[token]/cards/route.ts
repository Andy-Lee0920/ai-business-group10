import { NextResponse } from 'next/server';
import { CARD_TYPES } from '../../../../../src/types/care-cards.types';
import type { PartnerActionViewItem, PartnerDisplayState } from '../../../../../src/types/partner-view.types';
import { hashPartnerShareToken } from '../../../../../src/services/partner-view';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';

type PartnerRpcRow = {
  title: string;
  scheduled_at: string | null;
  card_type: string;
  description: string | null;
  display_state: string;
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

  return NextResponse.json({ items: toPartnerItems((data as PartnerRpcRow[] | null) ?? []) });
}

function toPartnerItems(rows: readonly PartnerRpcRow[]): PartnerActionViewItem[] {
  return rows.map(toPartnerItem).filter((item) => item !== null);
}

function toPartnerItem(row: PartnerRpcRow): PartnerActionViewItem | null {
  if (!isCardType(row.card_type) || !isDisplayState(row.display_state)) return null;
  return {
    title: row.title,
    scheduled_at: row.scheduled_at,
    card_type: row.card_type,
    description: row.description,
    display_state: row.display_state,
  };
}

function isCardType(value: string): value is PartnerActionViewItem['card_type'] {
  return CARD_TYPES.includes(value as PartnerActionViewItem['card_type']);
}

function isDisplayState(value: string): value is PartnerDisplayState {
  return ['current', 'new', 'changed_since_ack', 'revoked', 'superseded', 'completed'].includes(value);
}
