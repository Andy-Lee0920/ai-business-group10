import { NextResponse, type NextRequest } from 'next/server';
import { requireSupabasePublicConfig } from '../../../../src/lib/env';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import type { ClinicGuideMedicationNormalizeRequest, ClinicGuideMedicationNormalizeResponse } from '../../../../src/types/clinic-guide.types';

export async function POST(request: NextRequest) {
  const supabase = await createCookieBackedSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { userInput?: unknown };
  const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
  if (!userInput) return NextResponse.json({ error: 'userInput is required' }, { status: 400 });

  const config = requireSupabasePublicConfig();
  const edgeRequest: ClinicGuideMedicationNormalizeRequest = { userInput, patientId: user.id };
  const edgeResponse = await fetch(`${config.url}/functions/v1/clinic-guide-ai`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: config.anonKey,
      authorization: `Bearer ${config.anonKey}`,
    },
    body: JSON.stringify(edgeRequest),
  });

  const payload = await edgeResponse.json().catch(() => ({ matched: null, source: 'none' })) as ClinicGuideMedicationNormalizeResponse | { error: string };
  return NextResponse.json(payload, { status: edgeResponse.status });
}
