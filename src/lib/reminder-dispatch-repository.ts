import type { ReminderCandidate } from '../domain/reminder-dispatch';
import type { ReminderDispatchStore, ReminderDispatchWindow } from '../services/reminder-dispatch-service';

type DbError = { code?: string; message: string };
type RpcResult<T> = { data: T[] | null; error: DbError | null };
type SingleResult<T> = { data: T | null; error: DbError | null };
type InsertChain<T> = {
  insert(value: Record<string, unknown>): InsertChain<T>;
  select(columns: string): InsertChain<T>;
  single(): Promise<SingleResult<T>>;
};
type UpdateChain = {
  update(value: Record<string, unknown>): UpdateChain;
  eq(column: string, value: string): Promise<unknown> | UpdateChain;
};
type ReminderSupabaseClient = {
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'reminder_dispatches'): InsertChain<{ id: string }> & UpdateChain;
};

type DueReminderRow = {
  card_id: string;
  title: string;
  scheduled_at: string;
  recipient_email: string;
};

export class SupabaseReminderDispatchStore implements ReminderDispatchStore {
  constructor(private readonly supabase: ReminderSupabaseClient) {}

  async findDueEmailCandidates(window: ReminderDispatchWindow): Promise<ReminderCandidate[]> {
    const result = await this.supabase.rpc<DueReminderRow>('get_due_email_reminder_candidates', {
      p_window_start: window.startsAt,
      p_window_end: window.endsAt,
    });
    if (result.error) throw new Error(result.error.message);

    return (result.data ?? []).map((row) => ({
      cardId: row.card_id,
      title: row.title,
      scheduledAt: row.scheduled_at,
      recipientEmail: row.recipient_email,
    }));
  }

  async claimEmailDispatch(input: { cardId: string; scheduledAt: string; recipientEmail: string }) {
    const result = await this.supabase
      .from('reminder_dispatches')
      .insert({
        card_id: input.cardId,
        scheduled_at: input.scheduledAt,
        channel: 'email',
        status: 'queued',
        recipient_email: input.recipientEmail,
      })
      .select('id')
      .single();

    if (result.error) {
      if (isUniqueViolation(result.error)) return { claimed: false };
      throw new Error(result.error.message);
    }
    return result.data?.id ? { claimed: true, dispatchId: result.data.id } : { claimed: false };
  }

  async markEmailDispatchSent(input: { dispatchId: string; providerMessageId: string | null }) {
    await this.supabase
      .from('reminder_dispatches')
      .update({
        status: 'sent',
        provider_message_id: input.providerMessageId,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.dispatchId);
  }

  async markEmailDispatchFailed(input: { dispatchId: string; error: string }) {
    await this.supabase
      .from('reminder_dispatches')
      .update({
        status: 'failed',
        error_message: input.error.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.dispatchId);
  }
}

function isUniqueViolation(error: DbError) {
  return error.code === '23505' || /duplicate|unique/i.test(error.message);
}
