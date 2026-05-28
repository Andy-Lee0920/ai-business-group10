-- Canonical split_candidates confirmation can mark first capture completion without reusing the legacy confirm_capture RPC.

create or replace function public.mark_first_capture_completed(p_couple_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth.uid() required' using errcode = '28000';
  end if;

  if p_couple_id not in (select public.current_user_couple_ids()) then
    raise exception 'couple not found' using errcode = '42501';
  end if;

  update public.couple_states
  set first_capture_completed_at = coalesce(first_capture_completed_at, now()),
      updated_at = now()
  where couple_id = p_couple_id;
end;
$$;

revoke all on function public.mark_first_capture_completed(uuid) from public;
grant execute on function public.mark_first_capture_completed(uuid) to authenticated;
