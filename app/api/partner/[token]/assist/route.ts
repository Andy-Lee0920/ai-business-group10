import { NextResponse } from 'next/server';
import { canPartnerPerformAction, type PartnerPermissionAction } from '../../../../../src/domain/care-os-architecture';
import { hashPartnerShareToken } from '../../../../../src/services/partner-view';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';

type AssistBody = {
  action?: unknown;
  cardId?: unknown;
  actualTime?: unknown;
};

type PartnerAssistRpcRow = {
  card_safe_id: string;
  partner_assist_at: string;
};

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const body = (await request.json().catch(() => ({}))) as AssistBody;
  const action = normalizeAction(body.action);

  if (!action) return NextResponse.json({ error: 'invalid_partner_action' }, { status: 400 });
  if (!canPartnerPerformAction('assist_action', action)) {
    return NextResponse.json({ error: 'partner_action_forbidden' }, { status: 403 });
  }
  if (action !== 'record_assist') return NextResponse.json({ accepted: true }, { status: 202 });

  const cardId = typeof body.cardId === 'string' ? body.cardId : '';
  const actualTime = typeof body.actualTime === 'string' ? body.actualTime : new Date().toISOString();
  if (!cardId) return NextResponse.json({ error: 'card_id_required' }, { status: 400 });

  const { token } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const tokenHash = hashPartnerShareToken(token);
  const { data, error } = await supabase.rpc('record_partner_assist_by_safe_id', {
    p_token_hash: tokenHash,
    p_safe_id: cardId,
    p_actual_time: actualTime,
  });

  if (error) return NextResponse.json({ error: 'partner_assist_unavailable' }, { status: 404 });
  const row = Array.isArray(data) ? (data[0] as PartnerAssistRpcRow | undefined) : undefined;
  return NextResponse.json({ cardId, partnerAssistAt: row?.partner_assist_at ?? actualTime }, { status: 202 });
}

function normalizeAction(value: unknown): PartnerPermissionAction | null {
  if (
    value === 'read_schedule' ||
    value === 'send_support' ||
    value === 'record_assist' ||
    value === 'edit_dosage' ||
    value === 'edit_prescription'
  ) return value;
  return null;
}
