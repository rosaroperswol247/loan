-- Allow authenticated and anon roles to access profiles, personal_info, nominee_info, bank_info
grant select, insert, update on public.profiles to authenticated, anon;
grant select, insert, update, delete on public.personal_info to authenticated, anon;
grant select, insert, update, delete on public.nominee_info to authenticated, anon;
grant select, insert, update, delete on public.bank_info to authenticated, anon;

-- Resilient policies for profiles
drop policy if exists "anon select profiles" on public.profiles;
create policy "anon select profiles"
  on public.profiles for select to anon
  using (true);

drop policy if exists "anon update profiles" on public.profiles;
create policy "anon update profiles"
  on public.profiles for update to anon
  using (true)
  with check (true);

-- Resilient policies for personal_info
drop policy if exists "anon manage personal_info" on public.personal_info;
create policy "anon manage personal_info"
  on public.personal_info for all to anon
  using (true)
  with check (true);

drop policy if exists "authenticated manage personal_info" on public.personal_info;
create policy "authenticated manage personal_info"
  on public.personal_info for all to authenticated
  using (true)
  with check (true);

-- Resilient policies for nominee_info
drop policy if exists "anon manage nominee_info" on public.nominee_info;
create policy "anon manage nominee_info"
  on public.nominee_info for all to anon
  using (true)
  with check (true);

drop policy if exists "authenticated manage nominee_info" on public.nominee_info;
create policy "authenticated manage nominee_info"
  on public.nominee_info for all to authenticated
  using (true)
  with check (true);

-- Resilient policies for bank_info
drop policy if exists "anon manage bank_info" on public.bank_info;
create policy "anon manage bank_info"
  on public.bank_info for all to anon
  using (true)
  with check (true);

drop policy if exists "authenticated manage bank_info" on public.bank_info;
create policy "authenticated manage bank_info"
  on public.bank_info for all to authenticated
  using (true)
  with check (true);

-- Storage policies for applicant-documents bucket so staff and applicants can upload
drop policy if exists "allow all applicant documents upload" on storage.objects;
create policy "allow all applicant documents upload"
  on storage.objects for insert to authenticated, anon
  with check (bucket_id = 'applicant-documents');

drop policy if exists "allow all applicant documents update" on storage.objects;
create policy "allow all applicant documents update"
  on storage.objects for update to authenticated, anon
  using (bucket_id = 'applicant-documents')
  with check (bucket_id = 'applicant-documents');

drop policy if exists "allow all applicant documents select" on storage.objects;
create policy "allow all applicant documents select"
  on storage.objects for select to authenticated, anon
  using (bucket_id = 'applicant-documents');
