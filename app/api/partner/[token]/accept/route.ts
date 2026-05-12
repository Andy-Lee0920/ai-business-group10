import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../../src/lib/server-supabase';
import { hashPartnerShareToken } from '../../../../../src/services/partner-view';
import type { PartnerPermissionLevel, PatientSharingScope } from '../../../../../src/domain/care-os-architecture';

type PartnerJoinRow = {
  couple_id: string;
  cycle_id: string;
  partner_membership_id: string;
  patient_membership_id: string;
  sharing_scope: string;
  permission_level: string;
  accepted_at: string;
};

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createCookieBackedSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({
      error: 'unauthenticated',
      signInUrl: `/auth/sign-in?next=${encodeURIComponent(`/partner/${token}`)}`,
    }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('accept_partner_share_invite', {
    p_token_hash: hashPartnerShareToken(token),
  });

  if (error) return partnerInviteError(error.message);

  const row = firstJoinRow(data);
  if (!row) return NextResponse.json({ error: 'partner_invite_rejected' }, { status: 409 });

  const sharingScope = normalizeSharingScope(row.sharing_scope);
  const permissionLevel = normalizePermissionLevel(row.permission_level);
  const response = NextResponse.json({
    joined: true,
    redirectTo: `/partner/${token}?joined=1`,
    membership: {
      cycleId: row.cycle_id,
      coupleId: row.couple_id,
      role: 'partner',
      surface: 'partner_assist_operation',
      partnerMembershipId: row.partner_membership_id,
      patientMembershipId: row.patient_membership_id,
      sharingScope,
      permissionLevel,
      acceptedAt: row.accepted_at,
    },
  });

  response.cookies.set('fevio_partner_joined_cycle_id', row.cycle_id, { httpOnly: true, sameSite: 'lax', path: '/' });
  response.cookies.set('fevio_onboarding_role_context', 'partner', { httpOnly: true, sameSite: 'lax', path: '/' });

  return response;
}

function firstJoinRow(data: unknown): PartnerJoinRow | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== 'object') return null;
  const row = candidate as Partial<PartnerJoinRow>;
  if (
    typeof row.couple_id !== 'string' ||
    typeof row.cycle_id !== 'string' ||
    typeof row.partner_membership_id !== 'string' ||
    typeof row.patient_membership_id !== 'string' ||
    typeof row.accepted_at !== 'string'
  ) return null;
  return {
    couple_id: row.couple_id,
    cycle_id: row.cycle_id,
    partner_membership_id: row.partner_membership_id,
    patient_membership_id: row.patient_membership_id,
    sharing_scope: typeof row.sharing_scope === 'string' ? row.sharing_scope : 'care',
    permission_level: typeof row.permission_level === 'string' ? row.permission_level : 'assist_action',
    accepted_at: row.accepted_at,
  };
}

function normalizeSharingScope(value: string): PatientSharingScope {
  return value === 'basic' || value === 'care' || value === 'emotional' ? value : 'care';
}

function normalizePermissionLevel(value: string): PartnerPermissionLevel {
  return value === 'read' || value === 'soft_action' || value === 'assist_action' ? value : 'assist_action';
}

function partnerInviteError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('expired') || normalized.includes('revoked')) {
    return NextResponse.json({ error: 'partner_invite_expired' }, { status: 410 });
  }
  if (normalized.includes('not_found') || normalized.includes('not found')) {
    return NextResponse.json({ error: 'partner_invite_not_found' }, { status: 404 });
  }
  if (normalized.includes('own') || normalized.includes('used') || normalized.includes('occupied') || normalized.includes('different')) {
    return NextResponse.json({ error: 'partner_invite_rejected' }, { status: 409 });
  }
  return NextResponse.json({ error: 'partner_invite_rejected' }, { status: 409 });
}
