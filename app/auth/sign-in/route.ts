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

  const redirectTo = new URL('/auth/callback', appUrl).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/?auth_error=google_oauth_start_failed', appUrl));
  }

  return NextResponse.redirect(data.url);
}
