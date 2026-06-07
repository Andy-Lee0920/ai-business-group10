import type { CardType, CareCardStatus } from '../types/care-cards.types';

export type CanonicalCareActionAssigneeRole = 'primary_user' | 'partner' | 'both';
export type CanonicalCareActionCreateStatus = Extract<CareCardStatus, 'confirmed'>;

type DbError = { message: string; code?: string };
type SingleResult<T> = { data: T | null; error: DbError | null };
type SelectResult<T> = { data: T[] | null; error: DbError | null };
type InsertSelectChain<T> = { select(columns?: string): Promise<SelectResult<T>> | { single(): Promise<SingleResult<T>> } };
type UpdateFilterChain<T> = {
  eq(column: string, value: string): UpdateFilterChain<T>;
  select(columns: string): UpdateFilterChain<T>;
  maybeSingle(): Promise<SingleResult<T>>;
};
type SelectInChain<T> = {
  select(columns: string): { in(column: string, values: string[]): Promise<SelectResult<T>> };
};
type CareActionCardsTable<T> = SelectInChain<T> & {
  insert(rows: CanonicalCareActionCreate | CanonicalCareActionCreate[]): InsertSelectChain<T>;
  update(values: CanonicalCareActionCompleteUpdate): UpdateFilterChain<T>;
};

export class CanonicalCareActionWriteError extends Error {
  readonly code?: string;

  constructor(error: DbError) {
    super(error.message);
    this.name = 'CanonicalCareActionWriteError';
    this.code = error.code;
  }
}

export type CanonicalCareActionWriterClient<T = CanonicalCareActionRow> = {
  from(table: 'care_action_cards'): CareActionCardsTable<T>;
};

export type CanonicalCareActionCreate = {
  couple_id: string;
  created_by: string;
  source_input_id: string;
  split_candidate_id?: string | null;
  assignee_role: CanonicalCareActionAssigneeRole;
  card_type: CardType;
  title: string;
  description?: string | null;
  source_text: string;
  scheduled_at?: string | null;
  care_date?: string | null;
  status: CanonicalCareActionCreateStatus;
  confirmation_required: boolean;
  user_marked_important: boolean;
  partner_visible: boolean;
  prescription_photo_url?: string | null;
  prescription_capture_status?: 'photo_attached' | 'manual_fallback' | 'photo_failed' | null;
  administered_by?: 'self' | 'partner' | 'clinic' | null;
};

export type CanonicalCareActionRow = CanonicalCareActionCreate & {
  id: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
};

export type CanonicalCareActionCompleteUpdate = {
  status: Extract<CareCardStatus, 'completed'>;
  completed_at: string;
  updated_at: string;
};

export async function createConfirmedCareActions<T extends CanonicalCareActionRow = CanonicalCareActionRow>(
  client: CanonicalCareActionWriterClient<T>,
  rows: readonly CanonicalCareActionCreate[],
): Promise<T[]> {
  if (rows.length === 0) return [];

  const existingRows = await selectExistingSplitCandidateCards(client, rows);
  const existingSplitCandidateIds = new Set(
    existingRows
      .map((row) => row.split_candidate_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );
  const rowsToInsert = rows.filter((row) => !row.split_candidate_id || !existingSplitCandidateIds.has(row.split_candidate_id));
  const insertedRows = await insertCareActionRows(client, rowsToInsert);
  const rowBySplitCandidateId = new Map(
    [...existingRows, ...insertedRows]
      .map((row) => [row.split_candidate_id, row] as const)
      .filter((entry): entry is readonly [string, T] => typeof entry[0] === 'string' && entry[0].length > 0),
  );
  const unsourcedInsertedRows = insertedRows.filter((row) => !row.split_candidate_id);

  return rows
    .map((row) => (row.split_candidate_id ? rowBySplitCandidateId.get(row.split_candidate_id) ?? null : unsourcedInsertedRows.shift() ?? null))
    .filter((row): row is T => row !== null);
}

export async function createConfirmedCareAction<T extends CanonicalCareActionRow = CanonicalCareActionRow>(
  client: CanonicalCareActionWriterClient<T>,
  row: CanonicalCareActionCreate,
): Promise<T> {
  const existingRows = await selectExistingSplitCandidateCards(client, [row]);
  const existingRow = existingRows[0];
  if (existingRow) return existingRow;

  const cards = await insertCareActionRows<T>(client, [row], 'single');
  const card = cards[0];
  if (!card) throw new Error('care_action_cards insert failed');
  return card;
}

export async function completeCanonicalCareActionCard<T extends { id: string }>(
  client: CanonicalCareActionWriterClient<T>,
  input: { cardId: string; createdBy: string; completedAt: string },
): Promise<T | null> {
  const result = await client
    .from('care_action_cards')
    .update({ status: 'completed', completed_at: input.completedAt, updated_at: input.completedAt })
    .eq('id', input.cardId)
    .eq('created_by', input.createdBy)
    .select('id')
    .maybeSingle();
  if (result.error) throw new CanonicalCareActionWriteError(result.error);
  return result.data;
}

async function selectExistingSplitCandidateCards<T extends CanonicalCareActionRow>(
  client: CanonicalCareActionWriterClient<T>,
  rows: readonly CanonicalCareActionCreate[],
) {
  const splitCandidateIds = Array.from(new Set(rows.map((row) => row.split_candidate_id).filter((id): id is string => typeof id === 'string' && id.length > 0)));
  if (splitCandidateIds.length === 0) return [];

  const result = await client
    .from('care_action_cards')
    .select('id,couple_id,created_by,source_input_id,split_candidate_id,assignee_role,card_type,title,description,source_text,scheduled_at,care_date,status,confirmation_required,user_marked_important,partner_visible,created_at,updated_at,completed_at')
    .in('split_candidate_id', splitCandidateIds);
  if (result.error) throw new CanonicalCareActionWriteError(result.error);
  return result.data ?? [];
}

async function insertCareActionRows<T extends CanonicalCareActionRow>(
  client: CanonicalCareActionWriterClient<T>,
  rows: readonly CanonicalCareActionCreate[],
  mode: 'single' | 'bulk' = 'bulk',
) {
  if (rows.length === 0) return [];
  const insertValue = mode === 'single' ? rows[0] : [...rows];
  const selectResult = client.from('care_action_cards').insert(insertValue).select();
  if (hasSingleResult(selectResult)) {
    const result = await selectResult.single();
    if (result.error) throw new CanonicalCareActionWriteError(result.error);
    return result.data ? [result.data] : [];
  }

  const result = await selectResult;
  if (result.error) throw new CanonicalCareActionWriteError(result.error);
  return result.data ?? [];
}

function hasSingleResult<T>(value: Promise<SelectResult<T>> | { single(): Promise<SingleResult<T>> }): value is { single(): Promise<SingleResult<T>> } {
  return 'single' in value && typeof value.single === 'function';
}
