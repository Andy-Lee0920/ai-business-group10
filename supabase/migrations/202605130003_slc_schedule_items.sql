create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  medication_id text references medications(id),
  type text not null check (type in ('injection','medication','clinic')),
  title text not null,
  dose text,
  unit text,
  scheduled_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','due_soon','due','completed','missed')),
  source text not null check (source in ('seed','manual','clinic_update')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table schedule_items enable row level security;

-- patient: full CRUD on own items
drop policy if exists "patient_own_schedule" on schedule_items;
create policy "patient_own_schedule" on schedule_items
  for all using (auth.uid() = patient_id);

-- partner: read items where they are linked (join via partner_links)
drop policy if exists "partner_read_schedule" on schedule_items;
create policy "partner_read_schedule" on schedule_items
  for select using (
    exists (
      select 1 from partner_links
      where partner_links.patient_id = schedule_items.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );

-- seed demo data function (called on first login)
create or replace function seed_demo_schedule(p_patient_id uuid)
returns void language plpgsql security definer as $$
declare
  today_06 timestamptz := date_trunc('day', now()) + interval '6 hours 30 minutes';
  today_19 timestamptz := date_trunc('day', now()) + interval '19 hours';
begin
  insert into schedule_items (patient_id, medication_id, type, title, dose, unit, scheduled_at, source)
  values
    (p_patient_id, 'menopur', 'injection', 'Menopur 주사', '150', 'IU', today_06, 'seed'),
    (p_patient_id, 'cetrotide', 'injection', 'Cetrotide 주사', '0.25', 'mg', today_19, 'seed')
  on conflict do nothing;
end;
$$;
