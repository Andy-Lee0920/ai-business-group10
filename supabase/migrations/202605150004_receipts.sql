-- #356 Records receipt input.
-- Stores patient-entered receipt amounts under the couple shell so RLS stays
-- aligned with other sensitive care-operation tables.

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  amount integer not null,
  category text not null check (category <> ''),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists receipts_couple_date_idx
  on public.receipts(couple_id, date desc, created_at desc);

alter table public.receipts enable row level security;

drop policy if exists "receipts_select_own_couple" on public.receipts;
create policy "receipts_select_own_couple" on public.receipts
  for select to authenticated
  using (couple_id in (select public.current_user_couple_ids()));

drop policy if exists "receipts_insert_own_couple_after_privacy" on public.receipts;
create policy "receipts_insert_own_couple_after_privacy" on public.receipts
  for insert to authenticated
  with check (
    couple_id in (select public.current_user_couple_ids())
    and public.can_create_sensitive_rows(couple_id)
  );

grant select, insert on public.receipts to authenticated;
