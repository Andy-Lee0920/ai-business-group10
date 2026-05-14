import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { randomBytes } from 'crypto';
import { isMissingSlcTable } from '../../../../src/lib/slc-fallback';

export async function POST() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const existingCode = await supabase
    .from('partner_links')
    .select('invite_code, status')
    .eq('patient_id', user.id)
    .eq('status', 'pending')
    .single();

  if (existingCode.data) {
    return NextResponse.json({ inviteCode: existingCode.data.invite_code });
  }

  const inviteCode = randomBytes(8).toString('hex');
  const { error } = await supabase
    .from('partner_links')
    .insert({ patient_id: user.id, invite_code: inviteCode });

  if (error) {
    if (isMissingSlcTable(error)) return NextResponse.json({ inviteCode, fallback: 'missing_slc_schema' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inviteCode });
}

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('partner_links')
    .select('*')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ link: data ?? null });
}
