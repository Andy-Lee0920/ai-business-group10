import { NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '../../../../src/lib/server-supabase';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as ReflectionBody | null;
  const dwellMs = typeof body?.dwellMs === 'number' && body.dwellMs >= 0 ? Math.round(body.dwellMs) : 0;
  const submitted = body?.submitted === true;
  const opened = body?.opened === true;

  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from('brief_samples').insert({
      surface: 'reflection_turn',
      reflection_opened: opened,
      reflection_submitted: submitted,
      dwell_ms: dwellMs,
    });
  } catch {
    // Telemetry must not block the ephemeral reflection experience.
  }

  return NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
}

type ReflectionBody = {
  opened?: boolean;
  submitted?: boolean;
  dwellMs?: number;
};
