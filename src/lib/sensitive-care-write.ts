import { assertSensitiveWriteAllowed } from '../domain/auth-privacy';
import type { CareActionCard, CareCardStatus } from '../types/care-cards.types';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from './couple-bootstrap-admin';

type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type RpcResult<T> = { data: T[] | T | null; error: DbError | null };
type SelectChain<T> = { select(columns: string): SelectChain<T>; single(): Promise<SingleResult<T>> };

export type SensitiveCareWriteSupabaseClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: DbError | null }> };
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'visit_inputs' | 'care_action_cards'): {
    insert<T>(value: Record<string, unknown>): SelectChain<T>;
  };
};

type SensitiveCareUser = { id: string; email?: string | null };
type BootstrapRow = { couple_id: string; privacy_gate_accepted_at: string | null };
type VisitInputRow = { id: string };
type CardRow = { id: string; status: CareCardStatus };

export type SensitiveCareCardDraft = Pick<CareActionCard, 'assignee_role' | 'card_type' | 'title' | 'status'> &
  Partial<
    Pick<
      CareActionCard,
      | 'description'
      | 'source_text'
      | 'scheduled_at'
      | 'care_date'
      | 'confirmation_required'
      | 'user_marked_important'
      | 'partner_visible'
      | 'prescription_photo_url'
      | 'prescription_capture_status'
      | 'administered_by'
    >
  >;

export type SensitiveCareWriteInput = {
  sourceText: string;
  card: SensitiveCareCardDraft;
};

export type SensitiveCareWriteResult = {
  cardId: string;
  status: CareCardStatus;
  coupleId: string;
  visitInputId: string;
};

export async function createSensitiveCareActionCard(
  supabase: SensitiveCareWriteSupabaseClient,
  input: SensitiveCareWriteInput,
): Promise<SensitiveCareWriteResult> {
  const user = await getAuthenticatedUser(supabase);
  const bootstrap = await bootstrapSensitiveContext(supabase, user);
  assertSensitiveWriteAllowed({ privacyGateAcceptedAt: bootstrap.privacy_gate_accepted_at });

  const visitInput = await supabase
    .from('visit_inputs')
    .insert<VisitInputRow>({ couple_id: bootstrap.couple_id, raw_text: input.sourceText })
    .select('id')
    .single();
  if (visitInput.error || !visitInput.data) throw new Error(visitInput.error?.message ?? 'visit_inputs insert failed');

  const card = await supabase
    .from('care_action_cards')
    .insert<CardRow>({
      ...input.card,
      source_text: input.card.source_text ?? input.sourceText,
      couple_id: bootstrap.couple_id,
      created_by: user.id,
      source_input_id: visitInput.data.id,
    })
    .select('id,status')
    .single();
  if (card.error || !card.data) throw new Error(card.error?.message ?? 'care_action_cards insert failed');

  return {
    cardId: card.data.id,
    status: card.data.status,
    coupleId: bootstrap.couple_id,
    visitInputId: visitInput.data.id,
  };
}

export function isPrivacyGateRequiredError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('Privacy Gate must be accepted');
}

export function isMissingSupabasePublicConfigError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}

async function getAuthenticatedUser(supabase: SensitiveCareWriteSupabaseClient): Promise<SensitiveCareUser> {
  const userResult = await supabase.auth.getUser();
  if (userResult.error || !userResult.data.user) throw new Error(userResult.error?.message ?? 'Authentication required.');
  return userResult.data.user;
}

async function bootstrapSensitiveContext(supabase: SensitiveCareWriteSupabaseClient, user: SensitiveCareUser): Promise<BootstrapRow> {
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
