import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('init_couple_for_user');

  if (error) {
    return NextResponse.json({ error: 'bootstrap_failed', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ userId: userResult.user.id, shell: data?.[0] ?? null });
}
