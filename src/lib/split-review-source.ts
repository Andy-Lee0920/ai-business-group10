import { CARD_TYPES, type AssignedTo, type CardType } from '../types/care-cards.types';

export type SplitReviewCandidate = {
  sourceText: string;
  sourceOffsetStart: number | null;
  sourceOffsetEnd: number | null;
  assignedTo: AssignedTo | null;
  orderIndex: number;
  suggestedCardType: CardType | null;
  scheduledAt: string | null;
  careDate: string | null;
  description: string | null;
  userMarkedImportant: boolean;
  partnerVisible: boolean;
};

export type SplitReviewState = {
  visitInputId: string;
  draftId: string;
  rawText: string;
  candidates: SplitReviewCandidate[];
};

type DbError = { message: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type RowsResult<T> = { data: T[] | null; error: DbError | null };

type DraftRow = {
  id: string;
  visit_input_id: string;
  couple_id: string;
};

type VisitInputRow = {
  id: string;
  raw_text: string | null;
};

type PrimaryMemberRow = {
  id: string;
};

type SplitCandidateRow = {
  source_text: string | null;
  source_offset_start: number | null;
  source_offset_end: number | null;
  assigned_to: string | null;
  suggested_card_type: string | null;
  order_index: number | null;
  scheduled_at: string | null;
  care_date: string | null;
  description: string | null;
  user_marked_important: boolean | null;
  partner_visible: boolean | null;
};

type SingleByIdQuery<T> = {
  select(columns: string): {
    eq(column: 'id', value: string): {
      maybeSingle(): Promise<SingleResult<T>>;
    };
  };
};

type CandidateQuery = {
  select(columns: string): {
    eq(column: 'draft_id', value: string): {
      order(column: 'order_index', options: { ascending: boolean }): Promise<RowsResult<SplitCandidateRow>>;
    };
  };
};

type PrimaryMemberQuery = {
  select(columns: string): {
    eq(column: 'couple_id', value: string): {
      eq(column: 'user_id', value: string): {
        eq(column: 'role', value: 'primary'): {
          maybeSingle(): Promise<SingleResult<PrimaryMemberRow>>;
        };
      };
    };
  };
};

export interface SplitReviewSupabaseClient {
  from(table: 'action_split_drafts'): SingleByIdQuery<DraftRow>;
  from(table: 'visit_inputs'): SingleByIdQuery<VisitInputRow>;
  from(table: 'split_candidates'): CandidateQuery;
  from(table: 'couple_members'): PrimaryMemberQuery;
}

const ASSIGNED_TO_VALUES: readonly AssignedTo[] = ['my_action', 'partner_action', 'clinic_confirmation', 'excluded'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function isFetchableDraftId(value: string | null | undefined) {
  return Boolean(value && UUID_PATTERN.test(value));
}

export async function fetchSplitReviewByDraftId(
  supabase: SplitReviewSupabaseClient,
  draftId: string,
  userId: string,
): Promise<SplitReviewState | null> {
  const draft = await supabase
    .from('action_split_drafts')
    .select('id, visit_input_id, couple_id')
    .eq('id', draftId)
    .maybeSingle();

  if (draft.error || !draft.data) return null;

  const primaryMember = await supabase
    .from('couple_members')
    .select('id')
    .eq('couple_id', draft.data.couple_id)
    .eq('user_id', userId)
    .eq('role', 'primary')
    .maybeSingle();

  if (primaryMember.error || !primaryMember.data) return null;

  const visitInput = await supabase
    .from('visit_inputs')
    .select('id, raw_text')
    .eq('id', draft.data.visit_input_id)
    .maybeSingle();

  if (visitInput.error || !visitInput.data) return null;

  const candidates = await supabase
    .from('split_candidates')
    .select('source_text, source_offset_start, source_offset_end, assigned_to, suggested_card_type, order_index, scheduled_at, care_date, description, user_marked_important, partner_visible')
    .eq('draft_id', draft.data.id)
    .order('order_index', { ascending: true });

  if (candidates.error) return null;

  return {
    visitInputId: visitInput.data.id,
    draftId: draft.data.id,
    rawText: visitInput.data.raw_text ?? '',
    candidates: (candidates.data ?? []).map(toSplitReviewCandidate),
  };
}

function toSplitReviewCandidate(row: SplitCandidateRow, index: number): SplitReviewCandidate {
  return {
    sourceText: row.source_text?.trim() ?? '',
    sourceOffsetStart: row.source_offset_start,
    sourceOffsetEnd: row.source_offset_end,
    assignedTo: toAssignedTo(row.assigned_to),
    orderIndex: row.order_index ?? index,
    suggestedCardType: toCardType(row.suggested_card_type),
    scheduledAt: row.scheduled_at,
    careDate: row.care_date,
    description: row.description,
    userMarkedImportant: row.user_marked_important === true,
    partnerVisible: row.partner_visible === true,
  };
}

function toAssignedTo(value: string | null): AssignedTo | null {
  return ASSIGNED_TO_VALUES.includes(value as AssignedTo) ? value as AssignedTo : null;
}

function toCardType(value: string | null): CardType | null {
  return typeof value === 'string' && (CARD_TYPES as readonly string[]).includes(value) ? value as CardType : null;
}
