-- Allow status values 'pending', 'approved', 'rejected', 'unread', 'read' on public.notices
alter table public.notices drop constraint if exists notices_status_check;

alter table public.notices
  add constraint notices_status_check
  check (status in ('unread', 'read', 'pending', 'approved', 'rejected'));

alter table public.notices
  alter column status set default 'pending';

-- Convert existing 'unread' to 'pending'
update public.notices set status = 'pending' where status = 'unread';

-- Ensure authenticated staff and application can insert, select, update, delete notices
grant all on public.notices to authenticated;
grant select, insert, update on public.notices to anon;

-- Policy to allow all authenticated users (or staff) to insert notices
drop policy if exists "staff insert notices" on public.notices;
create policy "staff insert notices"
  on public.notices for insert to authenticated
  with check (true);

drop policy if exists "staff update notices" on public.notices;
create policy "staff update notices"
  on public.notices for update to authenticated
  using (true)
  with check (true);

drop policy if exists "anon update notices" on public.notices;
create policy "anon update notices"
  on public.notices for update to anon
  using (true)
  with check (true);
