-- Gastos: schema inicial com RLS multi-tenant
-- Cada usuário só acessa seus próprios dados (auth.uid()).
-- Estrutura já preparada para múltiplos "perfis de gasto" por usuário (pessoal/negócio),
-- mesmo que a v1 só use um perfil padrão por conta.

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles: dados de conta do usuário (estende auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan text not null default 'free',
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- spending_profiles: "perfis de gasto" (ex: Pessoal, Negócio)
-- ============================================================
create table public.spending_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Pessoal',
  is_default boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- accounts: contas/carteiras (corrente, dinheiro, cartão, etc.)
-- ============================================================
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','cash','credit_card','savings','investment','other')),
  initial_balance numeric(14,2) not null default 0,
  color text not null default '#6366f1',
  icon text not null default 'wallet',
  credit_limit numeric(14,2),
  closing_day smallint check (closing_day between 1 and 28),
  due_day smallint check (due_day between 1 and 28),
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- categories: 2 níveis via parent_id, fixa x variável
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  nature text not null default 'variable' check (nature in ('fixed','variable')),
  color text not null default '#6366f1',
  icon text not null default 'tag',
  monthly_budget numeric(14,2),
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- tags: livres, além de categoria
-- ============================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profile_id, name)
);

-- ============================================================
-- recurring_transactions: lançamentos fixos (assinatura, aluguel...)
-- ============================================================
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null,
  frequency text not null check (frequency in ('weekly','biweekly','monthly','yearly')),
  interval_count smallint not null default 1,
  day_of_month smallint check (day_of_month between 1 and 31),
  start_date date not null,
  end_date date,
  next_run_date date not null,
  auto_post boolean not null default false,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- transactions
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  transfer_account_id uuid references public.accounts(id) on delete set null,
  recurring_id uuid references public.recurring_transactions(id) on delete set null,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null default '',
  notes text,
  date date not null,
  status text not null default 'cleared' check (status in ('cleared','pending')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- ============================================================
-- budgets: override mensal de orçamento por categoria
-- ============================================================
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  year smallint not null,
  month smallint not null check (month between 1 and 12),
  amount numeric(14,2) not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, year, month)
);

-- ============================================================
-- índices
-- ============================================================
create index idx_spending_profiles_user on public.spending_profiles(user_id);
create index idx_accounts_user on public.accounts(user_id, updated_at);
create index idx_categories_user on public.categories(user_id, updated_at);
create index idx_tags_user on public.tags(user_id, updated_at);
create index idx_recurring_user on public.recurring_transactions(user_id, updated_at);
create index idx_transactions_user on public.transactions(user_id, updated_at);
create index idx_transactions_date on public.transactions(user_id, date);
create index idx_transactions_account on public.transactions(account_id);
create index idx_transactions_category on public.transactions(category_id);
create index idx_budgets_user on public.budgets(user_id, updated_at);

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_accounts_updated before update on public.accounts
  for each row execute procedure public.set_updated_at();
create trigger trg_categories_updated before update on public.categories
  for each row execute procedure public.set_updated_at();
create trigger trg_recurring_updated before update on public.recurring_transactions
  for each row execute procedure public.set_updated_at();
create trigger trg_transactions_updated before update on public.transactions
  for each row execute procedure public.set_updated_at();
create trigger trg_budgets_updated before update on public.budgets
  for each row execute procedure public.set_updated_at();
create trigger trg_spending_profiles_updated before update on public.spending_profiles
  for each row execute procedure public.set_updated_at();
create trigger trg_tags_updated before update on public.tags
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- onboarding automático: cria profile, perfil "Pessoal",
-- conta padrão e categorias padrão quando um usuário se cadastra
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.spending_profiles (user_id, name, is_default)
  values (new.id, 'Pessoal', true)
  returning id into v_profile_id;

  insert into public.accounts (user_id, profile_id, name, type, color, icon)
  values (new.id, v_profile_id, 'Carteira', 'cash', '#22c55e', 'wallet');

  insert into public.categories (user_id, profile_id, name, kind, nature, color, icon)
  values
    (new.id, v_profile_id, 'Salário', 'income', 'fixed', '#22c55e', 'banknote'),
    (new.id, v_profile_id, 'Outras receitas', 'income', 'variable', '#84cc16', 'plus-circle'),
    (new.id, v_profile_id, 'Moradia', 'expense', 'fixed', '#f97316', 'home'),
    (new.id, v_profile_id, 'Alimentação', 'expense', 'variable', '#f59e0b', 'utensils'),
    (new.id, v_profile_id, 'Transporte', 'expense', 'variable', '#3b82f6', 'car'),
    (new.id, v_profile_id, 'Saúde', 'expense', 'fixed', '#ef4444', 'heart-pulse'),
    (new.id, v_profile_id, 'Educação', 'expense', 'fixed', '#8b5cf6', 'book'),
    (new.id, v_profile_id, 'Lazer', 'expense', 'variable', '#ec4899', 'sparkles'),
    (new.id, v_profile_id, 'Assinaturas', 'expense', 'fixed', '#06b6d4', 'repeat');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.spending_profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.budgets enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "spending_profiles_select_own" on public.spending_profiles for select using (user_id = auth.uid());
create policy "spending_profiles_insert_own" on public.spending_profiles for insert with check (user_id = auth.uid());
create policy "spending_profiles_update_own" on public.spending_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "spending_profiles_delete_own" on public.spending_profiles for delete using (user_id = auth.uid());

create policy "accounts_select_own" on public.accounts for select using (user_id = auth.uid());
create policy "accounts_insert_own" on public.accounts for insert with check (user_id = auth.uid());
create policy "accounts_update_own" on public.accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accounts_delete_own" on public.accounts for delete using (user_id = auth.uid());

create policy "categories_select_own" on public.categories for select using (user_id = auth.uid());
create policy "categories_insert_own" on public.categories for insert with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_delete_own" on public.categories for delete using (user_id = auth.uid());

create policy "tags_select_own" on public.tags for select using (user_id = auth.uid());
create policy "tags_insert_own" on public.tags for insert with check (user_id = auth.uid());
create policy "tags_update_own" on public.tags for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tags_delete_own" on public.tags for delete using (user_id = auth.uid());

create policy "recurring_select_own" on public.recurring_transactions for select using (user_id = auth.uid());
create policy "recurring_insert_own" on public.recurring_transactions for insert with check (user_id = auth.uid());
create policy "recurring_update_own" on public.recurring_transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_delete_own" on public.recurring_transactions for delete using (user_id = auth.uid());

create policy "transactions_select_own" on public.transactions for select using (user_id = auth.uid());
create policy "transactions_insert_own" on public.transactions for insert with check (user_id = auth.uid());
create policy "transactions_update_own" on public.transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions_delete_own" on public.transactions for delete using (user_id = auth.uid());

create policy "transaction_tags_select_own" on public.transaction_tags for select using (
  exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
);
create policy "transaction_tags_insert_own" on public.transaction_tags for insert with check (
  exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
);
create policy "transaction_tags_delete_own" on public.transaction_tags for delete using (
  exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
);

create policy "budgets_select_own" on public.budgets for select using (user_id = auth.uid());
create policy "budgets_insert_own" on public.budgets for insert with check (user_id = auth.uid());
create policy "budgets_update_own" on public.budgets for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budgets_delete_own" on public.budgets for delete using (user_id = auth.uid());
