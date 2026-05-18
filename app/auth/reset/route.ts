import { NextRequest, NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

const FEVIO_STATE_COOKIES = [
  'fevio_onboarding_first_card',
  'fevio_onboarding_role_context',
  'fevio_onboarding_sharing_level',
  'fevio_onboarding_partner_invite',
  'fevio_onboarding_effective_stage',
  'fevio_onboarding_care_cycle_state',
  'fevio_partner_joined_cycle_id',
  'fevio_treatment_milestones',
  'fevio_treatment_cards',
] as const;

export async function GET(request: NextRequest) {
  const response = NextResponse.json(
    { error: 'method_not_allowed' },
    { status: 405 },
  );
  response.headers.set('allow', 'POST');
  response.headers.set('cache-control', 'no-store');
  return response;
}

export async function POST(request: NextRequest) {
  await signOutBestEffort();

  const response = NextResponse.json({ redirectTo: '/auth/sign-in' });
  for (const name of cookiesToClear(request)) {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      httpOnly: name.startsWith('fevio_') || name.startsWith('sb-'),
    });
  }
  response.headers.set('cache-control', 'no-store');
  return response;
}

async function signOutBestEffort() {
  try {
    const supabase = await createCookieBackedSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Reset must still clear local browser state even if Supabase config/session is unavailable.
  }
}

function cookiesToClear(request: NextRequest) {
  const names = new Set<string>(FEVIO_STATE_COOKIES);
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) names.add(cookie.name);
  }
  return names;
}
