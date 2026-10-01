# Supabase setup

## 1. Apply the database migrations

From the repository root, link the CLI to your Supabase project and apply both tracked migrations:

```bash
npx supabase login
npx supabase link --project-ref hltcbuhtenmwtvueayzy
npx supabase db push
```

The migrations create the tables, Row Level Security policies, profile/loan triggers, and private `applicant-documents` Storage bucket. Do not rerun the original table-creation SQL manually on an already initialized project; `db push` uses migration history to avoid recreating existing tables.

Do not make the document bucket public. It holds national ID images, photos, and signatures.

## 2. Enable phone/password authentication

In **Authentication → Sign In / Providers → Phone**, enable the Phone provider and turn **phone confirmations off**. Disable the Email provider for phone-only authentication. Registration and login use a phone number and password; no OTP is sent. If Supabase refuses to enable Phone without an SMS provider, its native phone/password flow still requires SMS-provider configuration even with confirmation disabled.

Without phone confirmation, users can register using numbers they do not own. Do not use this configuration for real applicant identity or banking data unless you accept that risk and have another verification control.

## 3. Create the first staff account

Register the staff account at the site with its phone number and a strong, unique password. Then run this query in SQL Editor, replacing the number with the staff account's E.164 phone number (for Bangladesh, for example, `+8801701234567`). Do not use a short numeric PIN for an administrator account; staff can access applicant identity and banking information.

```sql
insert into public.staff_members (user_id, role)
select id, 'admin'
from auth.users
where phone = '+8801701234567'
on conflict (user_id) do update set role = excluded.role;
```

The query must affect exactly one row. Staff privileges are stored only in `staff_members`; never grant them from browser input or user metadata.

## 4. Configure local and production environment

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key. `.env.local` is ignored by Git. Add the same two variables to the production host (for example, Vercel) and redeploy after changes.

The publishable key is designed to be public. Do not add a Supabase service-role or secret key to a `NEXT_PUBLIC_` variable or the browser bundle.

## 5. Data migration and go-live checks

The old `data/db.json` is local-only and is no longer used. It contains prototype credentials and applicant identity documents; this project does not import those records or passwords. Have users register again, and do not upload real applicant records until you have confirmed legal authority, retention, access, and recovery procedures.

Before opening the site to applicants, verify that an unauthenticated request is rejected, one customer cannot read another customer's records or files, and a staff account can review applicants while a normal account cannot. The migration's RLS policies enforce these boundaries, and document URLs expire after one hour.
