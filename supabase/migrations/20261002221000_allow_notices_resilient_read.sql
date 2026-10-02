-- Allow resilient read of notices
grant select on public.notices to anon;

create policy "anon read notices"
  on public.notices for select to anon
  using (true);

-- Ensure staff can update notice status
grant update on public.notices to authenticated;
