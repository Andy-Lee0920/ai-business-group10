import { NextRequest, NextResponse } from 'next/server';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

type CompleteBody = { cardId?: unknown };
type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type UpdateChain<T> = {
  eq(column: string, value: string): UpdateChain<T>;
  select(columns: string): UpdateChain<T>;
  single(): Promise<SingleResult<T>>;
};
type MedicationSupabaseClient = {
  from(table: 'care_action_cards'): {
    update<T>(value: Record<string, unknown>): UpdateChain<T>;
  };
};
type CardRow = { id: string; status: 'completed' };

const DEMO_COOKIE = 'fevio_privacy_accepted=1';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CompleteBody;
  const cardId = typeof body.cardId === 'string' ? body.cardId.trim() : '';
  if (!cardId) return NextResponse.json({ error: 'Card id is required.' }, { status: 400 });

  try {
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as MedicationSupabaseClient;
    const result = await supabase
      .from('care_action_cards')
      .update<CardRow>({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .select('id,status')
      .single();

    if (result.error || !result.data) throw new Error(result.error?.message ?? 'Completion update failed.');
    return NextResponse.json({ cardId: result.data.id, status: result.data.status, persisted: true });
  } catch (error) {
    if (isMissingConfigError(error) && hasDemoPrivacyCookie(request)) {
      return NextResponse.json({ cardId, status: 'completed', persisted: false });
    }
    throw error;
  }
}

function hasDemoPrivacyCookie(request: NextRequest) {
  return request.headers.get('cookie')?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}

function isMissingConfigError(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}
