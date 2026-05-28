-- #214 Partner approval identity: expose a requesting partner's display name to the patient.
-- PostgREST needs a direct FK relationship for partner_profile:user_profiles!partner_id(display_name).

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_links_partner_profile_fkey'
      and conrelid = 'public.partner_links'::regclass
  ) then
    alter table public.partner_links
      add constraint partner_links_partner_profile_fkey
      foreign key (partner_id)
      references public.user_profiles(id)
      on delete set null
      not valid;
  end if;
end $$;

drop policy if exists "patient_read_linked_partner_profiles" on public.user_profiles;
create policy "patient_read_linked_partner_profiles" on public.user_profiles
  for select using (
    exists (
      select 1
      from public.partner_links
      where partner_links.patient_id = auth.uid()
        and partner_links.partner_id = user_profiles.id
        and partner_links.status in ('requested', 'approved')
    )
  );
