create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text unique,
  created_at timestamptz not null default now()
);

create table public.staff_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

create table public.personal_info (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  applicant_name text not null default '',
  father_name text not null default '',
  mother_name text not null default '',
  nid_number text not null default '',
  blood_group text not null default '',
  present_address text not null default '',
  permanent_address text not null default '',
  profession text not null default '',
  nid_front_path text,
  nid_back_path text,
  applicant_photo_path text,
  signature_path text,
  updated_at timestamptz not null default now()
);

create table public.nominee_info (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  nominee_name text not null default '',
  relationship text not null default '',
  nominee_phone text not null default '',
  nominee_nid text not null default '',
  nominee_photo_path text,
  nominee_nid_front_path text,
  nominee_nid_back_path text,
  updated_at timestamptz not null default now()
);

create table public.bank_info (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  method text not null,
  account_number text not null,
  bank_name text not null default '',
  account_holder_name text not null default '',
  updated_at timestamptz not null default now()
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  applicant_name text not null,
  phone text not null default '',
  purpose text not null default 'personal-loan',
  amount numeric(14, 2) not null check (amount between 50000 and 2000000),
  tenure_months integer not null check (tenure_months between 12 and 60),
  interest_rate numeric(6, 5) not null default 0.024,
  monthly_emi numeric(14, 2) not null,
  total_repayment numeric(14, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  user_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  loan_id uuid references public.loans(id) on delete set null,
  title text not null,
  message text not null default '',
  status text not null default 'unread' check (status in ('unread', 'read')),
  created_at timestamptz not null default now()
);

create index loans_user_created_at_idx on public.loans (user_id, created_at desc);
create index notices_user_created_at_idx on public.notices (user_id, created_at desc);

create or replace function public.set_loan_values()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  applicant public.profiles%rowtype;
begin
  if tg_op = 'INSERT' and not (select public.is_staff()) then
    if new.user_id is distinct from (select auth.uid()) then
      raise exception 'Loan applicant must match the authenticated user';
    end if;

    select * into applicant
    from public.profiles
    where id = new.user_id;

    new.applicant_name := coalesce(nullif(applicant.full_name, ''), 'Applicant');
    new.phone := coalesce(applicant.phone, '');
    new.interest_rate := 0.024;
    new.total_repayment := round(
      new.amount + new.amount * new.tenure_months::numeric / 12 * 0.024
    );
    new.monthly_emi := round(new.total_repayment / new.tenure_months, 2);
    new.status := 'pending';
    new.user_balance := 0;
  end if;

  return new;
end;
$$;

create trigger set_loan_values_before_insert
  before insert on public.loans
  for each row execute procedure public.set_loan_values();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

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
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.personal_info enable row level security;
alter table public.nominee_info enable row level security;
alter table public.bank_info enable row level security;
alter table public.loans enable row level security;
alter table public.notices enable row level security;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.staff_members to authenticated;
grant select, insert, update on public.personal_info to authenticated;
grant select, insert, update on public.nominee_info to authenticated;
grant select, insert, update on public.bank_info to authenticated;
grant select, insert, update, delete on public.loans to authenticated;
grant select, insert, update, delete on public.notices to authenticated;

create policy "users read own profile, staff read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "users read own staff membership"
  on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy "users manage own personal info, staff read all"
  on public.personal_info for all to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()))
  with check (user_id = (select auth.uid()));

create policy "users manage own nominee info, staff read all"
  on public.nominee_info for all to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()))
  with check (user_id = (select auth.uid()));

create policy "users manage own bank info, staff read all"
  on public.bank_info for all to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()))
  with check (user_id = (select auth.uid()));

create policy "users read and submit own loans, staff read all"
  on public.loans for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy "users submit own pending loans"
  on public.loans for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and user_balance = 0
  );

create policy "staff manage loans"
  on public.loans for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "users read own notices, staff read all"
  on public.notices for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy "staff manage notices"
  on public.notices for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-documents',
  'applicant-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload own applicant documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'applicant-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users and staff read applicant documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_staff())
    )
  );

create policy "users update own applicant documents"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'applicant-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete own applicant documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
