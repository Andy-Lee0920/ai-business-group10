import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') ?? '7');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [itemsRes, completionsRes] = await Promise.all([
    supabase
      .from('schedule_items')
      .select('*')
      .eq('patient_id', user.id)
      .gte('scheduled_at', since)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('completion_records')
      .select('*')
      .eq('patient_id', user.id)
      .gte('created_at', since)
      .order('completed_at', { ascending: false }),
  ]);

  return NextResponse.json({
    items: itemsRes.data ?? [],
    completions: completionsRes.data ?? [],
  });
}
