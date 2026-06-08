-- #424 Push delivery failure tracking.
-- Adds observable failure metadata without changing reminder RLS policies.

alter table public.push_subscriptions
  add column if not exists revoked_at timestamptz null;

alter table public.reminder_dispatches
  add column if not exists failed_at timestamptz null,
  add column if not exists failure_reason text null;

create index if not exists push_subscriptions_active_user_idx
  on public.push_subscriptions(user_id, updated_at desc)
  where revoked_at is null;

create or replace function public.get_due_web_push_reminder_candidates(
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_channel text
)
returns table (
  card_id uuid,
  title text,
  scheduled_at timestamptz,
  push_subscriptions jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as card_id,
    c.title,
    c.scheduled_at,
    jsonb_agg(ps.subscription) as push_subscriptions
  from public.care_action_cards c
  join public.couple_states cs on cs.couple_id = c.couple_id
  join public.couple_members cm on cm.couple_id = c.couple_id and cm.role = 'primary'
  join public.push_subscriptions ps on ps.user_id = cm.user_id and ps.revoked_at is null
  where c.status = 'confirmed'
    and c.card_type = 'injection'
    and c.scheduled_at >= p_window_start
    and c.scheduled_at <= p_window_end
    and cs.privacy_gate_accepted_at is not null
    and p_channel in ('web_push_t60', 'web_push_t15')
    and not exists (
      select 1
      from public.reminder_dispatches rd
      where rd.card_id = c.id
        and rd.scheduled_at = c.scheduled_at
        and rd.channel = p_channel
    )
  group by c.id, c.title, c.scheduled_at, c.created_at
  order by c.scheduled_at asc, c.created_at asc;
$$;

comment on column public.push_subscriptions.revoked_at is
  'Server-set timestamp for browser push endpoints rejected by the upstream push service. Active subscriptions have revoked_at IS NULL.';

comment on column public.reminder_dispatches.failed_at is
  'Timestamp when an external reminder delivery attempt failed without queuing an immediate retry.';

comment on column public.reminder_dispatches.failure_reason is
  'Non-PII failure code such as subscription_revoked, push_service_5xx_<code>, or network_error_<code-or-kind>.';

comment on function public.get_due_web_push_reminder_candidates(timestamptz, timestamptz, text) is
  'Returns confirmed injection cards due for T-60/T-15 PWA push reminders with active browser subscription JSON only; excludes revoked subscriptions, raw memo text, and medical inference.';
