create table if not exists medications (
  id text primary key,
  brand_name_ko text not null,
  brand_name_en text,
  aliases text[] default '{}',
  category text not null check (category in ('stimulation','suppression','trigger','luteal_support','other')),
  route text not null check (route in ('subcutaneous_injection','intramuscular_injection','oral','vaginal','other')),
  default_unit text not null,
  default_cta text not null,
  patient_label text not null,
  short_description text,
  time_criticality text not null default 'normal' check (time_criticality in ('normal','high','critical')),
  storage_hint text,
  caution_note text,
  is_slc_seed boolean not null default true,
  created_at timestamptz default now()
);

-- RLS: medications는 read-only public (처방 dictionary)
alter table medications enable row level security;
create policy "anyone_can_read_medications" on medications for select using (true);

-- SLC seed data
insert into medications (id, brand_name_ko, brand_name_en, aliases, category, route, default_unit, default_cta, patient_label, time_criticality, is_slc_seed) values
  ('menopur', '메노푸어', 'Menopur', array['Menopur','메노퓨어'], 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Menopur', 'normal', true),
  ('gonal-f', '고날에프', 'Gonal-F', array['Gonal-F','고날-에프'], 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Gonal-F', 'normal', true),
  ('follistim', '폴리스팀', 'Follistim', array['Follistim','Puregon','퓨레곤'], 'stimulation', 'subcutaneous_injection', 'IU', '주사하기', 'Follistim', 'normal', true),
  ('cetrotide', '세트로타이드', 'Cetrotide', array['Cetrotide','세트로타이드'], 'suppression', 'subcutaneous_injection', 'mg', '주사하기', 'Cetrotide', 'high', true),
  ('ganirelix', '가니렐릭스', 'Ganirelix', array['Ganirelix','Orgalutran','오가루트란','Ganilever','가닐레버'], 'suppression', 'subcutaneous_injection', 'mg', '주사하기', 'Ganirelix', 'high', true),
  ('ovidrel', '오비드렐', 'Ovidrel', array['Ovidrel','오비드렐'], 'trigger', 'subcutaneous_injection', 'syringe', '주사하기', 'Ovidrel (트리거)', 'critical', true),
  ('crinone', '크리논', 'Crinone', array['Crinone','크리논'], 'luteal_support', 'vaginal', '개', '사용하기', 'Crinone', 'normal', true),
  ('endometrin', '엔도메트린', 'Endometrin', array['Endometrin','엔도메트린'], 'luteal_support', 'vaginal', '정', '사용하기', 'Endometrin', 'normal', true)
on conflict (id) do nothing;
