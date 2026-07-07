-- Gastos: metas financeiras (ex: reserva de emergência, viagem, etc.)

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  name text not null,
  icon text not null default 'piggy-bank',
  color text not null default '#6366f1',
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0,
  target_date date,
  account_id uuid references public.accounts(id) on delete set null,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_goals_user on public.goals(user_id, updated_at);

create trigger trg_goals_updated before update on public.goals
  for each row execute procedure public.set_updated_at();

alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals for select using (user_id = auth.uid());
create policy "goals_insert_own" on public.goals for insert with check (user_id = auth.uid());
create policy "goals_update_own" on public.goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goals_delete_own" on public.goals for delete using (user_id = auth.uid());
