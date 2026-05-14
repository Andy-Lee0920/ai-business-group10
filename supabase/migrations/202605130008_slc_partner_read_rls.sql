-- Allow approved partners to read patient schedule data
create policy "approved partner reads patient schedule"
  on public.schedule_items for select
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.partner_links
      where partner_links.patient_id = schedule_items.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );

create policy "approved partner reads patient completions"
  on public.completion_records for select
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.partner_links
      where partner_links.patient_id = completion_records.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );

create policy "approved partner reads patient clinic updates"
  on public.clinic_updates for select
  using (
    patient_id = auth.uid()
    or exists (
      select 1 from public.partner_links
      where partner_links.patient_id = clinic_updates.patient_id
        and partner_links.partner_id = auth.uid()
        and partner_links.status = 'approved'
    )
  );
