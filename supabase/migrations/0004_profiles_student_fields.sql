-- APLICADA em produção. Aditiva: não altera nem remove dados existentes.
alter table public.profiles
  add column if not exists institution text check (char_length(institution) <= 120),
  add column if not exists course text check (char_length(course) <= 120),
  add column if not exists semester_start date,
  add column if not exists semester_end date,
  add column if not exists monthly_income_goal numeric check (monthly_income_goal is null or monthly_income_goal >= 0);
