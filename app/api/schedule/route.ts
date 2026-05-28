import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { ScheduleItem } from '../../../src/types/slc.types';
import { maskTechnicalError } from '../../../src/domain/slc-copy';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('schedule_items')
    .select('*')
    .eq('patient_id', user.id)
    .gte('scheduled_at', todayStart.toISOString())
    .lte('scheduled_at', todayEnd.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) return NextResponse.json({ error: maskTechnicalError(error.message) }, { status: 500 });
  return NextResponse.json({ items: data as ScheduleItem[] });
}
