import { NextRequest, NextResponse } from 'next/server';
import {
  createPartnerShareToken,
  expiresSevenDaysFrom,
  hashPartnerShareToken,
} from '../../../src/services/partner-view';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

type CoupleShellRow = { couple_id: string };

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { data: shell, error: bootstrapError } = await supabase.rpc('init_couple_for_user');
  if (bootstrapError) return serverError('bootstrap_failed', bootstrapError.message);

  const coupleId = firstCoupleId(shell as CoupleShellRow[] | null);
  if (!coupleId) return serverError('couple_missing', 'Couple shell was not returned.');

  const token = createPartnerShareToken();
  const tokenHash = hashPartnerShareToken(token);
  const expiresAt = expiresSevenDaysFrom(new Date());

  await supabase
    .from('partner_share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('couple_id', coupleId)
    .is('revoked_at', null);

  const { error: insertError } = await supabase.from('partner_share_links').insert({
    couple_id: coupleId,
    created_by: userResult.user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) return serverError('partner_link_create_failed', insertError.message);

  return NextResponse.json({ url: partnerUrl(request, token), expires_at: expiresAt });
}

function firstCoupleId(rows: CoupleShellRow[] | null) {
  return rows?.[0]?.couple_id ?? null;
}

function partnerUrl(request: NextRequest, token: string) {
  return new URL(`/partner/${token}`, request.url).toString();
}

function serverError(error: string, detail: string) {
  return NextResponse.json({ error, detail }, { status: 500 });
}
