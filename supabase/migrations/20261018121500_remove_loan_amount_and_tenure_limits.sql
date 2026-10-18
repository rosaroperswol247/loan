-- Remove strict 50,000 to 2,000,000 limit and 12 to 60 tenure checks from public.loans so admin can set any amount/tenure freely
alter table public.loans drop constraint if exists loans_amount_check;
alter table public.loans drop constraint if exists loans_tenure_months_check;

-- Ensure amount and tenure are just positive numbers (> 0)
alter table public.loans
  add constraint loans_amount_check
  check (amount > 0);

alter table public.loans
  add constraint loans_tenure_months_check
  check (tenure_months > 0);
