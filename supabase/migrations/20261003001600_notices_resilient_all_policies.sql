-- Ensure complete resilience on public.notices for both authenticated staff and client callbacks
drop policy if exists "anon insert notices" on public.notices;
create policy "anon insert notices"
  on public.notices for insert to anon
  with check (true);

drop policy if exists "anon delete notices" on public.notices;
create policy "anon delete notices"
  on public.notices for delete to anon
  using (true);

drop policy if exists "staff delete notices" on public.notices;
create policy "staff delete notices"
  on public.notices for delete to authenticated
  using (true);

grant select, insert, update, delete on public.notices to authenticated, anon;
