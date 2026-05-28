import { NextRequest, NextResponse } from 'next/server';
import { getPublicAppUrl } from '../../../src/config';
import { PRIVACY_GATE_VERSION } from '../../../src/domain/auth-privacy';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const appUrl = getPublicAppUrl();

  if (!code) {
    return NextResponse.redirect(new URL('/?auth_error=missing_code', appUrl));
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return NextResponse.redirect(new URL('/?auth_error=session_exchange_failed', appUrl));
  }

  const { error: bootstrapError } = await supabase.rpc('init_couple_for_user');

  if (bootstrapError) {
    return NextResponse.redirect(new URL('/?auth_error=bootstrap_failed', appUrl));
  }

  // Privacy was accepted before login (cookie set, DB not yet written) — backfill now.
  const privacyCookie = request.cookies.get('fevio_privacy_gate_v1');
  if (privacyCookie?.value === 'accepted') {
    await supabase.rpc('accept_privacy_gate', { p_version: PRIVACY_GATE_VERSION });
  }

  return NextResponse.redirect(new URL('/privacy', appUrl));
}
