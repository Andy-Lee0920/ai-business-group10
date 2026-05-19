-- Deterministic medication reference image registry (ADR 0014).

create table if not exists public.medication_reference_assets (
  id uuid primary key default gen_random_uuid(),
  normalized_key text not null unique,
  display_label text not null,
  asset_path text not null,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.medication_reference_assets(normalized_key, display_label, asset_path)
values
  ('ovidrel', '오비드렐', 'medications/ovidrel.svg'),
  ('gonal-f', '고날에프', 'medications/gonal-f.svg'),
  ('cetrotide', '세트로타이드', 'medications/cetrotide.svg'),
  ('menopur', '메노푸어', 'medications/menopur.svg')
on conflict (normalized_key) do update
set display_label = excluded.display_label,
    asset_path = excluded.asset_path,
    disabled = false;

insert into storage.buckets (id, name, public)
values ('medication-assets', 'medication-assets', true)
on conflict (id) do update set public = true;
