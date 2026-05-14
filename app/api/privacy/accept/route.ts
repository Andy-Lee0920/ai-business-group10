import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import { PRIVACY_GATE_VERSION } from '../../../../src/domain/auth-privacy';
import { acceptPrivacyGateForUserWithServiceRole, bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from '../../../../src/lib/couple-bootstrap-admin';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

function isMissingConfig(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}

function redirectWithDemoCookie(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/onboarding', request.url), { status: 303 });
  response.cookies.set('fevio_privacy_accepted', '1', { httpOnly: true, sameSite: 'lax', path: '/' });
  response.cookies.set('fevio_privacy_gate_v1', 'accepted', { httpOnly: true, sameSite: 'lax', path: '/' });
  return response;
}

export async function POST(request: NextRequest) {
  const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false;

  if (isPresentationRequest(request)) {
    if (acceptsHtml) return redirectWithDemoCookie(request);
    return NextResponse.json({
      accepted: {
        privacy_gate_version: PRIVACY_GATE_VERSION,
        mode: 'presentation',
      },
    });
  }

  try {
    const supabase = await createCookieBackedSupabaseClient();
    const { data: userResult, error: userError } = await supabase.auth.getUser();

    if (userError || !userResult.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { error: bootstrapError } = await supabase.rpc('init_couple_for_user');
    if (bootstrapError) {
      if (!isInitCoupleAmbiguityError(bootstrapError)) {
        return NextResponse.json({ error: 'bootstrap_failed', detail: bootstrapError.message }, { status: 500 });
      }
      await bootstrapCoupleForUserWithServiceRole({ id: userResult.user.id, email: userResult.user.email });
    }

    const { data, error } = await supabase.rpc('accept_privacy_gate', { p_version: PRIVACY_GATE_VERSION });
    if (error) {
      if (!isInitCoupleAmbiguityError(error)) {
        return NextResponse.json({ error: 'privacy_accept_failed', detail: error.message }, { status: 500 });
      }
      const accepted = await acceptPrivacyGateForUserWithServiceRole({ id: userResult.user.id, email: userResult.user.email });
      return NextResponse.json({ accepted });
    }

    if (acceptsHtml) return redirectWithDemoCookie(request);
    return NextResponse.json({ accepted: data?.[0] ?? null });
  } catch (error) {
    if (isMissingConfig(error) && acceptsHtml) return redirectWithDemoCookie(request);
    if (isMissingConfig(error)) return NextResponse.json({ error: 'missing_supabase_config' }, { status: 503 });
    throw error;
  }
}
