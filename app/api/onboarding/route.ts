import { NextResponse, type NextRequest } from 'next/server';
import { SLC_CONSENT_COOKIE, SLC_ROLE_COOKIE, fallbackCookieOptions, isMissingSlcTable } from '../../../src/lib/slc-fallback';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import { createSupabaseServiceRoleClient } from '../../../src/lib/server-supabase-admin';
import { maskTechnicalError } from '../../../src/domain/slc-copy';
import { hasRequiredConsentChecks, type ConsentCheckState, type OnboardingRole } from '../../../src/features/onboarding/onboarding-flow';
import type { ScheduleType } from '../../../src/types/slc.types';

type FirstSchedulePayload = {
  type?: unknown;
  title?: unknown;
  dose?: unknown;
  unit?: unknown;
  scheduledAt?: unknown;
  medicationId?: unknown;
  optionalMemo?: unknown;
  inputAssist?: unknown;
};

type OnboardingBody = {
  role?: unknown;
  inviteCode?: unknown;
  consentChecks?: unknown;
  firstSchedule?: unknown;
  skipFirstSchedule?: unknown;
};

type ScheduleInsertRow = {
  patient_id: string;
  type: ScheduleType;
  title: string;
  dose: string | null;
  unit: string | null;
  scheduled_at: string;
  medication_id: string | null;
  source: 'onboarding_interview';
};

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as OnboardingBody;
  const role = normalizeRole(body.role);
  if (!role) return NextResponse.json({ error: 'invalid role' }, { status: 400 });

  const consentChecks = normalizeConsentChecks(body.consentChecks);
  if (!hasRequiredConsentChecks(consentChecks)) {
    return NextResponse.json({ error: '필수 동의 4가지를 모두 확인해 주세요.' }, { status: 400 });
  }

  const firstSchedule = normalizeFirstSchedule(body.firstSchedule);
  const skipFirstSchedule = body.skipFirstSchedule === true;
  if (role === 'patient' && !firstSchedule && !skipFirstSchedule) {
    return NextResponse.json({ error: '첫 일정을 확인하거나 나중에 할게요를 선택해 주세요.' }, { status: 400 });
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
      privacy_boundary_accepted_at: now,
      sensitive_data_accepted_at: now,
      medical_disclaimer_accepted_at: now,
      input_assist_disclaimer_accepted_at: now,
      partner_sharing_accepted_at: role === 'partner' ? now : null,
      consent_source: 'onboarding',
    });

  if (consentError) {
    if (isMissingSlcTable(consentError)) return fallbackOnboardingResponse(role);
    return NextResponse.json({ error: maskTechnicalError(consentError.message) }, { status: 500 });
  }

  if (role === 'partner') {
    const inviteCode = normalizeText(body.inviteCode);
    if (!inviteCode) return NextResponse.json({ error: '초대 코드를 입력해 주세요.' }, { status: 400 });
    const linkResult = await requestPartnerLink(inviteCode, user.id);
    if (linkResult) return linkResult;
    return NextResponse.json({ ok: true, role, redirectTo: '/partner' });
  }

  if (!firstSchedule) return NextResponse.json({ ok: true, role, redirectTo: '/home', firstScheduleItem: null });

  const { data: firstScheduleItem, error: scheduleError } = await supabase
    .from('schedule_items')
    .insert({ ...firstSchedule, patient_id: user.id })
    .select()
    .single();

  if (scheduleError) {
    if (isMissingSlcTable(scheduleError)) return fallbackOnboardingResponse(role);
    return NextResponse.json({ error: maskTechnicalError(scheduleError.message) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role, redirectTo: '/home', firstScheduleItem });
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

async function requestPartnerLink(inviteCode: string, partnerId: string) {
  const admin = createSupabaseServiceRoleClient();
  const { data: link, error: linkError } = await admin
    .from('partner_links')
    .select('id')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .is('partner_id', null)
    .maybeSingle();

  if (linkError || !link) return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 400 });

  const { error: updateError } = await admin
    .from('partner_links')
    .update({ partner_id: partnerId, status: 'requested', requested_at: new Date().toISOString() })
    .eq('id', link.id)
    .eq('status', 'pending')
    .is('partner_id', null);

  if (updateError) return NextResponse.json({ error: maskTechnicalError(updateError.message) }, { status: 500 });
  return null;
}

function normalizeRole(value: unknown): OnboardingRole | null {
  return value === 'patient' || value === 'partner' ? value : null;
}

function normalizeConsentChecks(value: unknown): ConsentCheckState {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {};
  const candidate = value as Record<string, unknown>;
  return {
    privacy_boundary: candidate.privacy_boundary === true,
    sensitive_data: candidate.sensitive_data === true,
    clinical_boundary: candidate.clinical_boundary === true,
    input_assist_boundary: candidate.input_assist_boundary === true,
  };
}

function normalizeFirstSchedule(value: unknown): Omit<ScheduleInsertRow, 'patient_id'> | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as FirstSchedulePayload;
  const type = normalizeScheduleType(candidate.type);
  const title = normalizeText(candidate.title);
  const scheduledAt = normalizeDateTime(candidate.scheduledAt);
  if (!type || !title || !scheduledAt) return null;

  return {
    type,
    title,
    dose: normalizeNullableText(candidate.dose),
    unit: normalizeNullableText(candidate.unit),
    scheduled_at: scheduledAt,
    medication_id: normalizeNullableText(candidate.medicationId),
    source: 'onboarding_interview',
  };
}

function normalizeScheduleType(value: unknown): ScheduleType | null {
  return value === 'injection' || value === 'medication' || value === 'clinic' ? value : null;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeDateTime(value: unknown) {
  const text = normalizeText(value);
  if (!text) return '';
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function fallbackOnboardingResponse(role: OnboardingRole) {
  const response = NextResponse.json({ ok: true, role, redirectTo: role === 'partner' ? '/partner' : '/home', fallback: 'missing_slc_schema' });
  response.cookies.set(SLC_ROLE_COOKIE, role, fallbackCookieOptions());
  response.cookies.set(SLC_CONSENT_COOKIE, 'accepted', fallbackCookieOptions());
  return response;
}
