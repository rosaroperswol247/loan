alter table public.profiles add column if not exists password text default '';
grant update (full_name, password) on public.profiles to authenticated;

update public.profiles p
set password = coalesce(u.raw_user_meta_data ->> 'raw_password', '')
from auth.users u
where p.id = u.id;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'raw_password', '')
  )
  on conflict (id) do update set
    password = coalesce(nullif(excluded.password, ''), public.profiles.password),
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;
