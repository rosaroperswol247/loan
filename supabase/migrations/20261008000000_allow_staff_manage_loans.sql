-- Allow resilient management of loans for authenticated and anon roles
drop policy if exists "staff manage loans" on public.loans;
create policy "staff manage loans"
  on public.loans for all to authenticated
  using (true)
  with check (true);

drop policy if exists "anon manage loans" on public.loans;
create policy "anon manage loans"
  on public.loans for all to anon
  using (true)
  with check (true);

grant select, insert, update, delete on public.loans to authenticated, anon;
