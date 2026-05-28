import { NextRequest, NextResponse } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import { assertSensitiveWriteAllowed } from '../../../../src/domain/auth-privacy';
import { buildPrescriptionMedicationCard, type PrescriptionAdministeredBy, type PrescriptionCaptureType } from '../../../../src/domain/prescription-capture';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from '../../../../src/lib/couple-bootstrap-admin';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';

type PrescriptionCaptureBody = {
  photoUrl?: unknown;
  type?: unknown;
  name?: unknown;
  dose?: unknown;
  doseConfirmed?: unknown;
  time?: unknown;
  administeredBy?: unknown;
};
type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type RpcResult<T> = { data: T[] | T | null; error: DbError | null };
type SelectChain<T> = { select(columns: string): SelectChain<T>; single(): Promise<SingleResult<T>> };
type PrescriptionSupabaseClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: DbError | null }> };
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'visit_inputs' | 'care_action_cards'): { insert<T>(value: Record<string, unknown>): SelectChain<T> };
};
type BootstrapRow = { couple_id: string; privacy_gate_accepted_at: string | null };
type VisitInputRow = { id: string };
type CardRow = { id: string; status: string };

const DEMO_COOKIE = 'fevio_privacy_accepted=1';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as PrescriptionCaptureBody;
  let draft: ReturnType<typeof buildPrescriptionMedicationCard>;

  try {
    draft = buildPrescriptionMedicationCard({
      photoUrl: String(body.photoUrl ?? ''),
      type: body.type as PrescriptionCaptureType,
      name: String(body.name ?? ''),
      dose: String(body.dose ?? ''),
      doseConfirmed: body.doseConfirmed === true,
      time: String(body.time ?? ''),
      administeredBy: body.administeredBy as PrescriptionAdministeredBy,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid prescription capture.' }, { status: 400 });
  }

  if (isPresentationRequest(request) && isDemoRequest(request)) {
    return NextResponse.json({ cardId: `demo-prescription-${Date.now()}`, status: 'confirmed', persisted: false, createdCardCount: 1, title: draft.title }, { status: 201 });
  }

  try {
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as PrescriptionSupabaseClient;
    const user = await getAuthenticatedUser(supabase);
    const bootstrap = await bootstrapSensitiveContext(supabase, user);
    try {
      assertSensitiveWriteAllowed({ privacyGateAcceptedAt: bootstrap.privacy_gate_accepted_at });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Privacy Gate must be accepted')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      throw error;
    }

    const visitInput = await supabase
      .from('visit_inputs')
      .insert<VisitInputRow>({ couple_id: bootstrap.couple_id, raw_text: draft.source_text })
      .select('id')
      .single();
    if (visitInput.error || !visitInput.data) throw new Error(visitInput.error?.message ?? 'visit_inputs insert failed');

    const card = await supabase
      .from('care_action_cards')
      .insert<CardRow>({
        couple_id: bootstrap.couple_id,
        created_by: user.id,
        source_input_id: visitInput.data.id,
        assignee_role: 'primary_user',
        status: 'confirmed',
        user_marked_important: draft.card_type === 'injection',
        ...draft,
      })
      .select('id,status')
      .single();
    if (card.error || !card.data) throw new Error(card.error?.message ?? 'care_action_cards insert failed');

    return NextResponse.json({ cardId: card.data.id, status: card.data.status, persisted: true, createdCardCount: 1, title: draft.title }, { status: 201 });
  } catch (error) {
    if (isMissingConfigError(error) && isDemoRequest(request)) {
      return NextResponse.json({ cardId: `demo-prescription-${Date.now()}`, status: 'confirmed', persisted: false, createdCardCount: 1, title: draft.title }, { status: 201 });
    }
    throw error;
  }
}

async function getAuthenticatedUser(supabase: PrescriptionSupabaseClient) {
  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) throw new Error(userResult.error?.message ?? 'Authentication required.');
  return userResult.data.user;
}

async function bootstrapSensitiveContext(supabase: PrescriptionSupabaseClient, user: { id: string; email?: string | null }) {
  const bootstrap = await supabase.rpc<BootstrapRow>('init_couple_for_user');
  if (!bootstrap.error) {
    const row = firstRow(bootstrap.data);
    if (!row) throw new Error('Couple shell missing.');
    return row;
  }

  if (!isInitCoupleAmbiguityError(bootstrap.error)) throw new Error(bootstrap.error.message);
  const shell = await bootstrapCoupleForUserWithServiceRole(user);
  return { couple_id: shell.couple_id, privacy_gate_accepted_at: shell.privacy_gate_accepted_at };
}

function firstRow<T>(value: T[] | T | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function isDemoRequest(request: NextRequest) {
  return request.headers.get('cookie')?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}

function isMissingConfigError(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}
