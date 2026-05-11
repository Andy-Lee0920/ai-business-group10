-- #52 Reminder Minimum: deterministic one-time email dispatch log.
-- The reminder is a communication log, not a medical judgment table.

create table if not exists public.reminder_dispatches (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.care_action_cards(id) on delete cascade,
  scheduled_at timestamptz not null,
  channel text not null check (channel in ('email')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  recipient_email text not null,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, scheduled_at, channel)
);

create index if not exists reminder_dispatches_card_idx
  on public.reminder_dispatches(card_id, scheduled_at);

alter table public.reminder_dispatches enable row level security;

create policy "reminder_dispatches_select_own" on public.reminder_dispatches
  for select to authenticated
  using (
    exists (
      select 1
      from public.care_action_cards c
      where c.id = reminder_dispatches.card_id
        and c.couple_id in (select public.current_user_couple_ids())
    )
  );

grant select on public.reminder_dispatches to authenticated;

create or replace function public.get_due_email_reminder_candidates(
  p_window_start timestamptz,
  p_window_end timestamptz
)
returns table (
  card_id uuid,
  title text,
  scheduled_at timestamptz,
  recipient_email text
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
    cm.email as recipient_email
  from public.care_action_cards c
  join public.couple_states cs on cs.couple_id = c.couple_id
  join public.couple_members cm on cm.couple_id = c.couple_id and cm.role = 'primary'
  where c.status = 'confirmed'
    and c.card_type = 'injection'
    and c.scheduled_at >= p_window_start
    and c.scheduled_at <= p_window_end
    and cm.email is not null
    and btrim(cm.email) <> ''
    and cs.privacy_gate_accepted_at is not null
    and not exists (
      select 1
      from public.reminder_dispatches rd
      where rd.card_id = c.id
        and rd.scheduled_at = c.scheduled_at
        and rd.channel = 'email'
    )
  order by c.scheduled_at asc, c.created_at asc;
$$;

grant execute on function public.get_due_email_reminder_candidates(timestamptz, timestamptz) to service_role;

comment on table public.reminder_dispatches is
  'One-time reminder email dispatch log for user-confirmed injection cards. Unique card/scheduled_at/channel prevents duplicate sends.';

comment on function public.get_due_email_reminder_candidates(timestamptz, timestamptz) is
  'Returns confirmed injection cards due for the 30-minute email reminder window without raw memo content or medical inference.';
