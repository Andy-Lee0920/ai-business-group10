-- #422 Reminder dispatch idempotency hardening.
-- Explicitly names the table-level dedupe key used by T-60/T-15 Web Push dispatch.
--
-- Duplicate preflight query before applying remotely:
--   select card_id, scheduled_at, channel, count(*)
--   from public.reminder_dispatches
--   group by card_id, scheduled_at, channel
--   having count(*) > 1;
--
-- If this query returns rows, stop and clean the duplicate dispatch history before
-- applying the constraint.

do $$
begin
  if exists (
    select 1
    from public.reminder_dispatches
    group by card_id, scheduled_at, channel
    having count(*) > 1
  ) then
    raise exception 'reminder_dispatches has duplicate card_id/scheduled_at/channel rows; cleanup is required before adding reminder_dispatches_card_time_channel_unique';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reminder_dispatches'::regclass
      and conname = 'reminder_dispatches_card_time_channel_unique'
  ) then
    alter table public.reminder_dispatches
      add constraint reminder_dispatches_card_time_channel_unique
      unique (card_id, scheduled_at, channel);
  end if;
end $$;

comment on constraint reminder_dispatches_card_time_channel_unique on public.reminder_dispatches is
  'Prevents duplicate reminder dispatch rows for the same confirmed card, scheduled time, and delivery channel.';
