import { NextResponse } from 'next/server';
import { computeCareSurface } from '../../../../../src/domain/care-surface-engine';
import { derivePartnerSurfaceSignal } from '../../../../../src/domain/partner-surface-signal';
import { hashPartnerShareToken } from '../../../../../src/services/partner-view';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { CARD_TYPES, type CardType } from '../../../../../src/types/care-cards.types';
import type { CareSurfaceOverrideReason, TimelineCareDay } from '../../../../../src/types/treatment-timeline.types';
import type { CareSurfacePhase, FevioSurfaceContext } from '../../../../../src/types/care-surface.types';

const TRIGGER_PATTERN = /트리거|오비드렐|ovidrel|데카펩틸|decapeptyl|trigger/iu;

type PartnerSurfaceRpcRow = {
  title: string;
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

  const rows = ((data as PartnerSurfaceRpcRow[] | null) ?? []).filter((row) => isCardType(row.card_type));
  const context = toFevioSurfaceContext(rows);
  const composition = computeCareSurface(context);
  const signal = derivePartnerSurfaceSignal(composition, phaseForCareDay(context.careDay, context.overrideReason ?? 'none'));

  return NextResponse.json(signal, {
    headers: {
      'cache-control': 'no-store',
      'x-fevio-sync-strategy': 'swr-30s',
    },
  });
}

function toFevioSurfaceContext(rows: readonly PartnerSurfaceRpcRow[]): FevioSurfaceContext {
  const overrideReason = deriveOverrideReason(rows);
  return {
    careDay: deriveCareDay(rows),
    overrideReason,
    cardCount: rows.length,
    partnerStatus: rows.length > 0 ? 'connected' : 'unknown',
    emotionTrend: undefined,
  };
}

function deriveCareDay(rows: readonly PartnerSurfaceRpcRow[]): TimelineCareDay {
  if (rows.some((row) => row.card_type === 'injection')) return 'injection_day';
  if (rows.some((row) => row.card_type === 'clinic_visit' || row.card_type === 'clinic_confirmation')) return 'clinic_day';
  if (rows.length === 0) return 'routine_day';
  return 'routine_day';
}

function deriveOverrideReason(rows: readonly PartnerSurfaceRpcRow[]): CareSurfaceOverrideReason {
  return rows.some((row) => row.card_type === 'injection' && TRIGGER_PATTERN.test(`${row.title} ${row.description ?? ''}`)) ? 'trigger_shot' : 'none';
}

function phaseForCareDay(careDay: TimelineCareDay, overrideReason: CareSurfaceOverrideReason): CareSurfacePhase {
  if (overrideReason === 'trigger_shot') return 'injection';
  if (careDay === 'injection_day') return 'injection';
  if (careDay === 'clinic_day') return 'clinic';
  if (careDay === 'waiting_day') return 'waiting';
  return 'routine';
}

function isCardType(value: string): value is CardType {
  return CARD_TYPES.includes(value as CardType);
}
