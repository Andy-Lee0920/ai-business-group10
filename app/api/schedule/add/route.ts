import { NextResponse, type NextRequest } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { isMissingSlcTable } from '../../../../src/lib/slc-fallback';
import type { ScheduleType } from '../../../../src/types/slc.types';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json() as {
    type: ScheduleType;
    title: string;
    dose?: string;
    unit?: string;
    scheduledAt: string;
    medicationId?: string;
  };

  const { error, data } = await supabase
    .from('schedule_items')
    .insert({
      patient_id: user.id,
      type: body.type,
      title: body.title,
      dose: body.dose ?? null,
      unit: body.unit ?? null,
      scheduled_at: body.scheduledAt,
      medication_id: body.medicationId ?? null,
      source: 'manual',
    })
    .select()
    .single();

  if (error) {
    if (isMissingSlcTable(error)) {
      return NextResponse.json({ item: { id: `fallback-${Date.now()}`, patient_id: user.id, status: 'upcoming', source: 'manual', ...body }, fallback: 'missing_slc_schema' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}
