import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPublicAppUrl, isPresentationRequest } from '../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export async function GET(request: NextRequest) {
  const appUrl = getPublicAppUrl();

  if (isPresentationRequest(request)) {
    return NextResponse.redirect(new URL('/privacy?mode=presentation', request.url));
  }

  let supabase;

  try {
    supabase = await createCookieBackedSupabaseClient();
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=missing_supabase_config', appUrl));
  }

  const { data: userResult } = await supabase.auth.getUser();
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'));
  if (userResult.user) {
    const response = NextResponse.redirect(new URL(nextPath ?? '/home', request.url));
    setPrivacyCookies(response);
    return response;
  }

  if (request.cookies.get('fevio_privacy_gate_v1')?.value !== 'accepted') {
    return NextResponse.redirect(new URL('/privacy?next=/auth/sign-in', request.url));
  }

  const redirectTo = new URL('/auth/callback', appUrl).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { prompt: 'select_account' } },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/?auth_error=google_oauth_start_failed', appUrl));
  }

  return NextResponse.redirect(data.url);
}


function safeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/privacy') || next.startsWith('/auth/sign-in')) return null;
  return next;
}

function setPrivacyCookies(response: NextResponse) {
  response.cookies.set('fevio_privacy_accepted', '1', { httpOnly: true, sameSite: 'lax', path: '/' });
  response.cookies.set('fevio_privacy_gate_v1', 'accepted', { httpOnly: true, sameSite: 'lax', path: '/' });
}
