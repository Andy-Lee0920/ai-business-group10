import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { linkId, action } = await request.json() as { linkId: string; action: 'approve' | 'reject' };

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const { error } = await supabase
    .from('partner_links')
    .update({ status: newStatus, approved_at: action === 'approve' ? new Date().toISOString() : null })
    .eq('id', linkId)
    .eq('patient_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
