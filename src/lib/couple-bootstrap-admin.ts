import { PRIVACY_GATE_VERSION } from '../domain/auth-privacy';
import { createSupabaseServiceRoleClient } from './server-supabase-admin';

type CoupleShell = {
  couple_id: string;
  primary_member_id: string;
  partner_member_id: string;
  privacy_gate_accepted_at: string | null;
  privacy_gate_version?: string | null;
};

type ExistingMember = { id: string; couple_id: string };
type CoupleState = { privacy_gate_accepted_at: string | null; privacy_gate_version: string | null };

export function isInitCoupleAmbiguityError(error: { message?: string } | null | undefined) {
  return error?.message?.includes('column reference "couple_id" is ambiguous') ?? false;
}

export async function bootstrapCoupleForUserWithServiceRole(user: { id: string; email?: string | null }): Promise<CoupleShell> {
  const supabase = createSupabaseServiceRoleClient();
  const existing = await supabase
    .from('couple_members')
    .select('id,couple_id')
    .eq('user_id', user.id)
    .eq('role', 'primary')
    .limit(1)
    .maybeSingle<ExistingMember>();

  if (existing.error) throw new Error(existing.error.message);

  const coupleId = existing.data?.couple_id ?? (await createCoupleForUser(user.id));
  const primaryMemberId = existing.data?.id ?? (await createPrimaryMember(coupleId, user));
  const partnerMemberId = await ensurePartnerMember(coupleId);
  const state = await ensureCoupleState(coupleId);

  return {
    couple_id: coupleId,
    primary_member_id: primaryMemberId,
    partner_member_id: partnerMemberId,
    privacy_gate_accepted_at: state.privacy_gate_accepted_at,
    privacy_gate_version: state.privacy_gate_version,
  };
}

export async function acceptPrivacyGateForUserWithServiceRole(user: { id: string; email?: string | null }) {
  const shell = await bootstrapCoupleForUserWithServiceRole(user);
  const supabase = createSupabaseServiceRoleClient();
  const acceptedAt = new Date().toISOString();
  const result = await supabase
    .from('couple_states')
    .update({
      privacy_gate_accepted_at: shell.privacy_gate_accepted_at ?? acceptedAt,
      privacy_gate_accepted_by: user.id,
      privacy_gate_version: shell.privacy_gate_version ?? PRIVACY_GATE_VERSION,
      updated_at: acceptedAt,
    })
    .eq('couple_id', shell.couple_id)
    .select('couple_id,privacy_gate_accepted_at,privacy_gate_version')
    .single();

  if (result.error || !result.data) throw new Error(result.error?.message ?? 'privacy gate service fallback failed');
  return result.data;
}

async function createCoupleForUser(userId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const result = await supabase.from('couples').insert({ created_by: userId }).select('id').single<{ id: string }>();
  if (result.error || !result.data) throw new Error(result.error?.message ?? 'couple service fallback insert failed');
  return result.data.id;
}

async function createPrimaryMember(coupleId: string, user: { id: string; email?: string | null }) {
  const supabase = createSupabaseServiceRoleClient();
  const result = await supabase
    .from('couple_members')
    .insert({ couple_id: coupleId, user_id: user.id, role: 'primary', email: user.email ?? null })
    .select('id')
    .single<{ id: string }>();
  if (result.error || !result.data) throw new Error(result.error?.message ?? 'primary member service fallback insert failed');
  return result.data.id;
}

async function ensurePartnerMember(coupleId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const existing = await supabase
    .from('couple_members')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('role', 'partner')
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const inserted = await supabase
    .from('couple_members')
    .insert({ couple_id: coupleId, user_id: null, role: 'partner', email: null })
    .select('id')
    .single<{ id: string }>();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? 'partner member service fallback insert failed');
  return inserted.data.id;
}

async function ensureCoupleState(coupleId: string): Promise<CoupleState> {
  const supabase = createSupabaseServiceRoleClient();
  const existing = await supabase
    .from('couple_states')
    .select('privacy_gate_accepted_at,privacy_gate_version')
    .eq('couple_id', coupleId)
    .limit(1)
    .maybeSingle<CoupleState>();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  const inserted = await supabase
    .from('couple_states')
    .insert({ couple_id: coupleId })
    .select('privacy_gate_accepted_at,privacy_gate_version')
    .single<CoupleState>();
  if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? 'couple state service fallback insert failed');
  return inserted.data;
}
