import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../src/config';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from '../../../src/lib/couple-bootstrap-admin';
import { createCookieBackedSupabaseClient } from '../../../src/lib/server-supabase';

type ReceiptBody = {
  amount?: unknown;
  category?: unknown;
  date?: unknown;
  note?: unknown;
};

type BootstrapRow = {
  couple_id: string;
  privacy_gate_accepted_at: string | null;
};

type ReceiptRow = {
  id: string;
  couple_id: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ReceiptBody;
  const input = normalizeReceipt(body);
  if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

  if (isPresentationRequest(request)) {
    return NextResponse.json({
      receipt: {
        id: `demo-receipt-${Date.now()}`,
        couple_id: 'presentation-couple',
        amount: input.amount,
        category: input.category,
        date: input.date,
        note: input.note,
        created_at: new Date().toISOString(),
      },
      persisted: false,
    }, { status: 201 });
  }

  const supabase = await createCookieBackedSupabaseClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const bootstrap = await bootstrapCouple(supabase, userResult.user);
  if ('error' in bootstrap) return NextResponse.json({ error: bootstrap.error }, { status: bootstrap.status });

  const result = await supabase
    .from('receipts')
    .insert({
      couple_id: bootstrap.couple_id,
      amount: input.amount,
      category: input.category,
      date: input.date,
      note: input.note,
    })
    .select('id,couple_id,amount,category,date,note,created_at')
    .single<ReceiptRow>();

  if (result.error || !result.data) {
    return NextResponse.json({ error: result.error?.message ?? 'receipt_insert_failed' }, { status: 500 });
  }

  return NextResponse.json({ receipt: result.data, persisted: true }, { status: 201 });
}

function normalizeReceipt(body: ReceiptBody):
  | { amount: number; category: string; date: string; note: string | null }
  | { error: string } {
  const amount = typeof body.amount === 'number' ? body.amount : Number.parseInt(String(body.amount ?? ''), 10);
  const category = normalizeText(body.category);
  const date = normalizeText(body.date);
  const note = normalizeText(body.note);

  if (!Number.isInteger(amount) || amount === 0) return { error: '영수증 금액을 입력해 주세요.' };
  if (!category) return { error: '영수증 분류를 선택해 주세요.' };
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return { error: '날짜를 YYYY-MM-DD 형식으로 입력해 주세요.' };
  }

  return { amount, category, date, note: note || null };
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function bootstrapCouple(
  supabase: Awaited<ReturnType<typeof createCookieBackedSupabaseClient>>,
  user: { id: string; email?: string | null },
): Promise<BootstrapRow | { error: string; status: number }> {
  const bootstrap = await supabase.rpc('init_couple_for_user');
  if (!bootstrap.error) {
    const row = Array.isArray(bootstrap.data) ? bootstrap.data[0] as BootstrapRow | undefined : bootstrap.data as BootstrapRow | null;
    if (row?.couple_id) return row;
  }

  if (isInitCoupleAmbiguityError(bootstrap.error)) {
    const shell = await bootstrapCoupleForUserWithServiceRole(user);
    return {
      couple_id: shell.couple_id,
      privacy_gate_accepted_at: shell.privacy_gate_accepted_at,
    };
  }

  return { error: bootstrap.error?.message ?? 'couple_bootstrap_failed', status: 500 };
}
