import { NextRequest, NextResponse } from 'next/server';
import { PRIVACY_GATE_VERSION } from '../../../../src/domain/auth-privacy';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { error: bootstrapError } = await supabase.rpc('init_couple_for_user');
  if (bootstrapError) {
    return NextResponse.json({ error: 'bootstrap_failed', detail: bootstrapError.message }, { status: 500 });
  }

  const { data, error } = await supabase.rpc('accept_privacy_gate', { p_version: PRIVACY_GATE_VERSION });
  if (error) {
    return NextResponse.json({ error: 'privacy_accept_failed', detail: error.message }, { status: 500 });
  }

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (acceptsHtml) {
    return NextResponse.redirect(new URL('/capture', request.url), { status: 303 });
  }

  return NextResponse.json({ accepted: data?.[0] ?? null });
}
