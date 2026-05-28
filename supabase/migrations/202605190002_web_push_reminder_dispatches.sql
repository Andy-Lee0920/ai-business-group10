-- MVP Web Push reminder dispatch channels.
-- Keeps reminder dispatch dedupe deterministic while moving external delivery from email to PWA push.

alter table public.reminder_dispatches
  drop constraint if exists reminder_dispatches_channel_check;

alter table public.reminder_dispatches
  add constraint reminder_dispatches_channel_check
  check (channel in ('email', 'web_push_t60', 'web_push_t15'));

alter table public.reminder_dispatches
  alter column recipient_email drop not null;

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
  join public.push_subscriptions ps on ps.user_id = cm.user_id
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

grant execute on function public.get_due_web_push_reminder_candidates(timestamptz, timestamptz, text) to service_role;

comment on function public.get_due_web_push_reminder_candidates(timestamptz, timestamptz, text) is
  'Returns confirmed injection cards due for T-60/T-15 PWA push reminders with browser subscription JSON only; excludes raw memo text and medical inference.';
