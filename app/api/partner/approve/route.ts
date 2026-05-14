import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

type PartnerApprovalAction = 'approve' | 'reject' | 'revoke';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { linkId, action } = await request.json() as { linkId?: string; action?: PartnerApprovalAction };
  if (!linkId || !isPartnerApprovalAction(action)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const updateValues = partnerApprovalUpdate(action);
  const { error } = await supabase
    .from('partner_links')
    .update(updateValues)
    .eq('id', linkId)
    .eq('patient_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, action });
}

function isPartnerApprovalAction(action: unknown): action is PartnerApprovalAction {
  return action === 'approve' || action === 'reject' || action === 'revoke';
}

function partnerApprovalUpdate(action: PartnerApprovalAction) {
  if (action === 'approve') return { status: 'approved', approved_at: new Date().toISOString() };
  if (action === 'reject') return { status: 'rejected', approved_at: null };
  return {
    status: 'pending',
    partner_id: null,
    requested_at: null,
    approved_at: null,
  };
}
