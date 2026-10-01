create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'contact_phone', ''))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
