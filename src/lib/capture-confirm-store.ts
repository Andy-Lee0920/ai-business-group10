import { randomUUID } from 'node:crypto';
import { isPresentationRequest } from '../config';
import { assertSensitiveWriteAllowed } from '../domain/auth-privacy';
import { inferCardType, type AssignedTo, type CardType } from '../domain/line-split';
import { bootstrapCoupleForUserWithServiceRole, isInitCoupleAmbiguityError } from './couple-bootstrap-admin';
import { createCookieBackedSupabaseClient } from './server-supabase';

type BootstrapRow = { couple_id: string; privacy_gate_accepted_at: string | null };
type DbError = { message: string };
type InsertResult<T> = { data: T | null; error: DbError | null };
type RpcResult<T> = { data: T[] | T | null; error: DbError | null };
type SelectBuilder<T> = { select(columns: string): SelectBuilder<T>; single(): Promise<InsertResult<T>> };
type UpdateBuilder<T> = { eq(column: string, value: string): Promise<InsertResult<T>> };
type QueryBuilder = {
  insert<T>(value: Record<string, unknown> | Record<string, unknown>[]): SelectBuilder<T>;
  update<T>(value: Record<string, unknown>): UpdateBuilder<T>;
};
type CaptureSupabaseClient = {
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: string): QueryBuilder;
};

export type ConfirmItem = {
  sourceText: string;
  sourceOffsetStart?: number | null;
  sourceOffsetEnd?: number | null;
  assignedTo: AssignedTo;
  orderIndex: number;
  userSelectedCardType?: CardType | null;
  suggestedCardType?: CardType | null;
  scheduledAt?: string | null;
  careDate?: string | null;
  description?: string | null;
  userMarkedImportant?: boolean;
  partnerVisible?: boolean;
};

export type ConfirmInput = { draftId: string; visitInputId: string; items: ConfirmItem[] };
export type CaptureStore = {
  coupleId: string;
  createCapture(rawText: string): Promise<{ visitInputId: string; draftId: string }>;
  confirm(input: ConfirmInput): Promise<{ createdCardCount: number }>;
};

const DEMO_COOKIE = 'fevio_privacy_accepted=1';

function firstRow<T>(value: T[] | T | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function hasDemoPrivacyCookie(cookieHeader: string | null) {
  return cookieHeader?.split(';').some((part) => part.trim() === DEMO_COOKIE) ?? false;
}

function isMissingConfigError(error: unknown) {
  return error instanceof Error && error.message.includes('Missing Supabase public config');
}

class DemoCaptureStore implements CaptureStore {
  readonly coupleId = 'demo-couple';

  async createCapture() {
    return { visitInputId: randomUUID(), draftId: randomUUID() };
  }

  async confirm(input: ConfirmInput) {
    return { createdCardCount: input.items.filter((item) => item.assignedTo !== 'excluded').length };
  }
}

class SupabaseCaptureStore implements CaptureStore {
  constructor(
    readonly coupleId: string,
    private readonly supabase: CaptureSupabaseClient,
  ) {}

  async createCapture(rawText: string) {
    const visitInput = await this.supabase
      .from('visit_inputs')
      .insert<{ id: string }>({ couple_id: this.coupleId, raw_text: rawText })
      .select('id')
      .single();
    if (visitInput.error || !visitInput.data) throw new Error(visitInput.error?.message ?? 'visit_inputs insert failed');

    const draft = await this.supabase
      .from('action_split_drafts')
      .insert<{ id: string }>({ couple_id: this.coupleId, visit_input_id: visitInput.data.id, status: 'draft' })
      .select('id')
      .single();
    if (draft.error || !draft.data) throw new Error(draft.error?.message ?? 'action_split_drafts insert failed');

    return { visitInputId: visitInput.data.id, draftId: draft.data.id };
  }

  async confirm(input: ConfirmInput) {
    const items = input.items.map((item) => ({
      source_text: item.sourceText,
      source_offset_start: item.sourceOffsetStart ?? null,
      source_offset_end: item.sourceOffsetEnd ?? null,
      assigned_to: item.assignedTo,
      suggested_card_type: item.suggestedCardType ?? null,
      card_type:
        item.assignedTo === 'excluded'
          ? null
          : inferCardType(item.sourceText, item.assignedTo, item.userSelectedCardType, item.suggestedCardType),
      order_index: item.orderIndex,
      scheduled_at: item.scheduledAt ?? null,
      care_date: item.careDate ?? null,
      description: item.description ?? null,
      user_marked_important: item.userMarkedImportant === true,
      partner_visible: item.partnerVisible === true,
    }));

    const result = await this.supabase.rpc<{ created_card_count: number }>('confirm_capture', {
      p_draft_id: input.draftId,
      p_visit_input_id: input.visitInputId,
      p_items: items,
    });
    if (result.error) throw new Error(result.error.message);

    const row = firstRow(result.data);
    return { createdCardCount: row?.created_card_count ?? 0 };
  }
}

export async function createCaptureStore(request: Request): Promise<CaptureStore | Response> {
  if (isPresentationRequest(request) && hasDemoPrivacyCookie(request.headers.get('cookie'))) {
    return new DemoCaptureStore();
  }

  try {
    const supabase = (await createCookieBackedSupabaseClient()) as unknown as CaptureSupabaseClient;
    const bootstrap = await supabase.rpc<BootstrapRow>('init_couple_for_user');
    if (bootstrap.error) {
      if (!isInitCoupleAmbiguityError(bootstrap.error) || !('auth' in supabase)) {
        return Response.json({ error: bootstrap.error.message }, { status: 401 });
      }

      const userResult = await (supabase as CaptureSupabaseClient & { auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null }; error: DbError | null }> } }).auth.getUser();
      if (userResult.error || !userResult.data.user) return Response.json({ error: bootstrap.error.message }, { status: 401 });

      const shell = await bootstrapCoupleForUserWithServiceRole(userResult.data.user);
      assertSensitiveWriteAllowed({ privacyGateAcceptedAt: shell.privacy_gate_accepted_at ?? null });
      return new SupabaseCaptureStore(shell.couple_id, supabase);
    }

    const row = firstRow(bootstrap.data);
    assertSensitiveWriteAllowed({ privacyGateAcceptedAt: row?.privacy_gate_accepted_at ?? null });
    if (!row) return Response.json({ error: 'Couple shell missing.' }, { status: 401 });

    return new SupabaseCaptureStore(row.couple_id, supabase);
  } catch (error) {
    if (isMissingConfigError(error) && hasDemoPrivacyCookie(request.headers.get('cookie'))) return new DemoCaptureStore();
    if (error instanceof Error && error.message.includes('Privacy Gate must be accepted')) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
