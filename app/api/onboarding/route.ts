import { NextResponse, type NextRequest } from 'next/server';
import { isPresentationMode } from '../../../src/config';
import { getSeedItems } from '../../../src/lib/seed-helpers';
import { SLC_CONSENT_COOKIE, SLC_ROLE_COOKIE, fallbackCookieOptions, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { maskTechnicalError } from '../../../src/domain/slc-copy';

type OnboardingRole = 'patient' | 'partner';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { role, inviteCode } = await request.json() as { role: OnboardingRole; inviteCode?: string };
  if (role !== 'patient' && role !== 'partner') {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  const displayName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, role, display_name: displayName });

  if (profileError) {
    if (isMissingSlcTable(profileError)) return fallbackOnboardingResponse(role);
    return NextResponse.json({ error: maskTechnicalError(profileError.message) }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { error: consentError } = await supabase
    .from('user_consents')
    .upsert({
      user_id: user.id,
      role,
      consent_version: 'slc-v1',
      sensitive_data_accepted_at: now,
      medical_disclaimer_accepted_at: now,
      partner_sharing_accepted_at: now,
    });

  if (consentError) {
    if (isMissingSlcTable(consentError)) return fallbackOnboardingResponse(role);
    return NextResponse.json({ error: maskTechnicalError(consentError.message) }, { status: 500 });
  }

  if (role === 'partner' && inviteCode) {
    const linkResult = await requestPartnerLink(supabase, inviteCode, user.id);
    if (linkResult) return linkResult;
  }

  if (role === 'patient') {
    const seedError = await seedPatientSchedule(supabase, user.id);
    if (seedError) return seedError;
  }

  return NextResponse.json({ ok: true, role });
}

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({ profile: data ?? null });
}

async function requestPartnerLink(supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>, inviteCode: string, partnerId: string) {
  const { data: link, error: linkError } = await supabase
    .from('partner_links')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .maybeSingle();

  if (linkError || !link) return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 400 });

  const { error: updateError } = await supabase
    .from('partner_links')
    .update({ partner_id: partnerId, status: 'requested', requested_at: new Date().toISOString() })
    .eq('id', link.id);

  if (updateError) return NextResponse.json({ error: maskTechnicalError(updateError.message) }, { status: 500 });
  return null;
}

async function seedPatientSchedule(supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>, patientId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase
    .from('schedule_items')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .gte('scheduled_at', todayStart.toISOString());

  if (countError) {
    if (isMissingSlcTable(countError)) return null;
    return NextResponse.json({ error: maskTechnicalError(countError.message) }, { status: 500 });
  }
  if ((count ?? 0) > 0) return null;

  const mode = isPresentationMode() ? 'presentation' : 'production';
  const { error: seedError } = await supabase.from('schedule_items').insert(getSeedItems(patientId, mode));
  if (seedError) {
    if (isMissingSlcTable(seedError)) return null;
    return NextResponse.json({ error: maskTechnicalError(seedError.message) }, { status: 500 });
  }
  return null;
}

function fallbackOnboardingResponse(role: OnboardingRole) {
  const response = NextResponse.json({ ok: true, role, fallback: 'missing_slc_schema' });
  response.cookies.set(SLC_ROLE_COOKIE, role, fallbackCookieOptions());
  response.cookies.set(SLC_CONSENT_COOKIE, 'accepted', fallbackCookieOptions());
  return response;
}
