import { NextResponse, type NextRequest } from 'next/server';
import { maskTechnicalError } from '../../../../src/domain/slc-copy';
import { createSupabaseServiceRoleClient } from '../../../../src/lib/server-supabase-admin';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

const CLINIC_PHOTOS_BUCKET = 'clinic-photos';

const USER_SCOPED_TABLES = [
  { table: 'completion_records', column: 'patient_id' },
  { table: 'clinic_updates', column: 'patient_id' },
  { table: 'schedule_candidates', column: 'patient_id' },
  { table: 'schedule_items', column: 'patient_id' },
  { table: 'user_consents', column: 'user_id' },
  { table: 'user_profiles', column: 'id' },
] as const;

const COUPLE_SCOPED_DELETE_TABLES = [
  'injection_logs',
  'care_memberships',
  'treatment_milestones',
  'treatment_cycles',
  'partner_share_links',
  'care_action_cards',
  'split_candidates',
  'action_split_drafts',
  'visit_inputs',
] as const;

const RESET_STATE_COOKIES = [
  'fevio_slc_role_v1',
  'fevio_slc_consent_v1',
  'fevio_first_schedule_skipped_v1',
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

type DbError = { message: string; code?: string };
type DbResult<T> = { data: T | null; error: DbError | null };
type CoupleMemberRow = { couple_id: string | null };
type ClinicPhotoRow = { name: string };

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createSupabaseServiceRoleClient();
  const deletedTables = new Set<string>();

  const coupleRows = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id) as DbResult<CoupleMemberRow[]>;
  if (coupleRows.error) return resetError(coupleRows.error);

  const coupleIds = (coupleRows.data ?? [])
    .map((row) => row.couple_id)
    .filter((coupleId): coupleId is string => typeof coupleId === 'string' && coupleId.length > 0);

  const partnerDelete = await admin
    .from('partner_links')
    .delete()
    .or(`patient_id.eq.${user.id},partner_id.eq.${user.id}`) as DbResult<null>;
  if (partnerDelete.error) return resetError(partnerDelete.error);
  deletedTables.add('partner_links');

  for (const scope of USER_SCOPED_TABLES) {
    const result = await admin.from(scope.table).delete().eq(scope.column, user.id) as DbResult<null>;
    if (result.error) return resetError(result.error);
    deletedTables.add(scope.table);
  }

  if (coupleIds.length > 0) {
    for (const table of COUPLE_SCOPED_DELETE_TABLES) {
      const result = await admin.from(table).delete().in('couple_id', coupleIds) as DbResult<null>;
      if (result.error) return resetError(result.error);
      deletedTables.add(table);
    }

    const stateReset = await admin
      .from('couple_states')
      .update({ first_capture_completed_at: null, waiting_mode_enabled: false, updated_at: new Date().toISOString() })
      .in('couple_id', coupleIds) as DbResult<null>;
    if (stateReset.error) return resetError(stateReset.error);
    deletedTables.add('couple_states');
  }

  await removeClinicPhotosBestEffort(admin, user.id);

  const response = NextResponse.json({ ok: true, redirectTo: '/onboarding', deletedTables: Array.from(deletedTables).sort() });
  clearResetStateCookies(request, response);
  response.headers.set('cache-control', 'no-store');
  return response;
}

function resetError(error: DbError) {
  return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
}

async function removeClinicPhotosBestEffort(admin: ReturnType<typeof createSupabaseServiceRoleClient>, userId: string) {
  const bucket = admin.storage.from(CLINIC_PHOTOS_BUCKET);
  const { data, error } = await bucket.list(userId) as DbResult<ClinicPhotoRow[]>;
  if (error || !data || data.length === 0) return;

  const paths = data
    .map((item) => item.name)
    .filter((name) => name.length > 0)
    .map((name) => `${userId}/${name}`);
  if (paths.length > 0) await bucket.remove(paths);
}

function clearResetStateCookies(request: NextRequest, response: NextResponse) {
  const names = new Set<string>(RESET_STATE_COOKIES);
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('fevio_onboarding_') || cookie.name.startsWith('fevio_treatment_')) names.add(cookie.name);
  }

  for (const name of names) {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      httpOnly: name.startsWith('fevio_'),
    });
  }
}
