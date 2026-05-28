import type { ReminderCandidate, ReminderPushWindow } from '../domain/reminder-dispatch';
import type { ReminderDispatchStore, ReminderDispatchWindow, ReminderPushCandidate, ReminderPushDispatchStore, ReminderPushSubscription } from '../services/reminder-dispatch-service';

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
type DeleteChain = {
  delete(): DeleteChain;
  eq(column: string, value: string): Promise<unknown>;
};
type ReminderSupabaseClient = {
  rpc<T>(name: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  from(table: 'reminder_dispatches'): InsertChain<{ id: string }> & UpdateChain;
  from(table: 'push_subscriptions'): DeleteChain;
};

type DueReminderRow = {
  card_id: string;
  title: string;
  card_type: 'injection' | 'medication';
  scheduled_at: string;
  recipient_email: string;
};

type DuePushReminderRow = {
  card_id: string;
  title: string;
  card_type: 'injection' | 'medication';
  scheduled_at: string;
  push_subscriptions: unknown;
};

export class SupabaseReminderDispatchStore implements ReminderDispatchStore, ReminderPushDispatchStore {
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
      cardType: row.card_type,
      scheduledAt: row.scheduled_at,
      recipientEmail: row.recipient_email,
    }));
  }


  async findDuePushCandidates(window: ReminderPushWindow): Promise<ReminderPushCandidate[]> {
    const result = await this.supabase.rpc<DuePushReminderRow>('get_due_web_push_reminder_candidates', {
      p_window_start: window.startsAt,
      p_window_end: window.endsAt,
      p_channel: window.channel,
    });
    if (result.error) throw new Error(result.error.message);

    return (result.data ?? []).map((row) => ({
      cardId: row.card_id,
      title: row.title,
      cardType: row.card_type,
      scheduledAt: row.scheduled_at,
      recipientEmail: '',
      pushSubscriptions: normalizePushSubscriptions(row.push_subscriptions),
    })).filter((candidate) => candidate.pushSubscriptions.length > 0);
  }

  async claimPushDispatch(input: { cardId: string; scheduledAt: string; channel: ReminderPushWindow['channel'] }) {
    const result = await this.supabase
      .from('reminder_dispatches')
      .insert({
        card_id: input.cardId,
        scheduled_at: input.scheduledAt,
        channel: input.channel,
        status: 'queued',
      })
      .select('id')
      .single();

    if (result.error) {
      if (isUniqueViolation(result.error)) return { claimed: false };
      throw new Error(result.error.message);
    }
    return result.data?.id ? { claimed: true, dispatchId: result.data.id } : { claimed: false };
  }

  async markPushDispatchSent(input: { dispatchId: string; providerMessageId: string | null }) {
    await this.markDispatchSent(input);
  }

  async markPushDispatchFailed(input: { dispatchId: string; error: string }) {
    await this.markDispatchFailed(input);
  }

  async deletePushSubscription(input: { endpoint: string }) {
    await this.supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', input.endpoint);
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
    await this.markDispatchSent(input);
  }

  async markEmailDispatchFailed(input: { dispatchId: string; error: string }) {
    await this.markDispatchFailed(input);
  }

  private async markDispatchSent(input: { dispatchId: string; providerMessageId: string | null }) {
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

  private async markDispatchFailed(input: { dispatchId: string; error: string }) {
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

function normalizePushSubscriptions(value: unknown): ReminderPushSubscription[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    const keys = candidate.keys as Record<string, unknown> | undefined;
    if (typeof candidate.endpoint !== 'string' || !keys) return [];
    if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return [];
    return [{ endpoint: candidate.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }];
  });
}
