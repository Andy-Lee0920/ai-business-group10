import { NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';
import type { PatientSharingScope } from '../../../src/domain/care-os-architecture';

type SharingScopeRow = {
  cycle_id: string;
  sharing_scope: string;
  partner_connected: boolean;
};

type SharingScopeBody = {
  sharingScope?: unknown;
};

export async function GET() {
  const supabase = await createCookieBackedSupabaseClient();
  const auth = await supabase.auth.getUser();
  if (auth.error || !auth.data.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data, error } = await supabase.rpc('get_patient_sharing_scope');
  if (error) return NextResponse.json({ error: 'sharing_scope_unavailable' }, { status: 404 });

  const row = firstSharingScopeRow(data);
  if (!row) return NextResponse.json({ error: 'sharing_scope_missing' }, { status: 404 });
  return NextResponse.json(toPayload(row));
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SharingScopeBody;
  const sharingScope = normalizeSharingScope(body.sharingScope);
  if (!sharingScope) return NextResponse.json({ error: 'invalid_sharing_scope' }, { status: 400 });

  const supabase = await createCookieBackedSupabaseClient();
  const auth = await supabase.auth.getUser();
  if (auth.error || !auth.data.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data, error } = await supabase.rpc('set_patient_sharing_scope', { p_scope: sharingScope });
  if (error) return NextResponse.json({ error: 'sharing_scope_update_failed' }, { status: 409 });

  const row = firstSharingScopeRow(data);
  if (!row) return NextResponse.json({ error: 'sharing_scope_missing' }, { status: 404 });
  return NextResponse.json(toPayload(row));
}

function firstSharingScopeRow(data: unknown): SharingScopeRow | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== 'object') return null;
  const row = candidate as Partial<SharingScopeRow>;
  if (typeof row.cycle_id !== 'string') return null;
  const sharingScope = normalizeSharingScope(row.sharing_scope);
  if (!sharingScope) return null;
  return {
    cycle_id: row.cycle_id,
    sharing_scope: sharingScope,
    partner_connected: row.partner_connected === true,
  };
}

function toPayload(row: SharingScopeRow) {
  return {
    cycleId: row.cycle_id,
    sharingScope: normalizeSharingScope(row.sharing_scope) ?? 'care',
    partnerConnected: row.partner_connected === true,
  };
}

function normalizeSharingScope(value: unknown): PatientSharingScope | null {
  return value === 'basic' || value === 'care' || value === 'emotional' ? value : null;
}
