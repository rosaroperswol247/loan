# Supabase setup

## 1. Apply the database migration

In the Supabase dashboard for this project, open **SQL Editor**, create a query, paste the contents of [`migrations/20261001000000_init_loan_schema.sql`](migrations/20261001000000_init_loan_schema.sql), and run it once. It creates the application tables, Row Level Security policies, the profile trigger, and the private `applicant-documents` Storage bucket.

Do not make the document bucket public. It holds national ID images, photos, and signatures.

## 2. Enable phone/password authentication

In **Authentication → Sign In / Providers**, enable **Phone** and disable phone confirmation. Registration immediately creates a session using the phone number and password; no SMS provider or OTP is used. If Supabase does not return a session at registration, phone confirmation is still enabled.

Set the site's production URL and allowed redirect URLs under **Authentication → URL Configuration**.

## 3. Create the first staff account

In **Authentication → Users**, select **Add user** and create the staff account with its E.164 phone number (for Bangladesh, for example, `+8801701234567`) and a strong, unique password. Phone confirmation is disabled for this project, so no OTP is needed. Do not use a short numeric PIN for an administrator account; staff can access applicant identity and banking information.

Then run this query in SQL Editor, replacing the number with the staff account's phone number:

```sql
insert into public.staff_members (user_id, role)
select id, 'admin'
from auth.users
where phone = '+8801712345678'
on conflict (user_id) do update set role = excluded.role;
```

The query must affect exactly one row. Staff privileges are stored only in `staff_members`; never grant them from browser input or user metadata.

## 4. Configure local and production environment

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key. `.env.local` is ignored by Git. Add the same two variables to the production host (for example, Vercel) and redeploy after changes.

The publishable key is designed to be public. Do not add a Supabase service-role or secret key to a `NEXT_PUBLIC_` variable or the browser bundle.

## 5. Data migration and go-live checks

The old `data/db.json` is local-only and is no longer used. It contains prototype credentials and applicant identity documents; this project does not import those records or passwords. Have users register again, and do not upload real applicant records until you have confirmed legal authority, retention, access, and recovery procedures.

Before opening the site to applicants, verify that an unauthenticated request is rejected, one customer cannot read another customer's records or files, and a staff account can review applicants while a normal account cannot. The migration's RLS policies enforce these boundaries, and document URLs expire after one hour.
