-- Prumo: projetos de melhoria (DMAIC). Cada projeto guarda as 5 etapas em `data` (jsonb).
-- Mesmo padrão das demais tabelas sincronizadas: user_id, profile_id, soft delete, updated_at e RLS por dono.

create table public.improvement_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.spending_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category_id uuid references public.categories(id) on delete set null,
  stage text not null default 'define' check (stage in ('define', 'measure', 'analyze', 'improve', 'control', 'done')),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 200000),
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_improvement_projects_user on public.improvement_projects(user_id, updated_at);
create index idx_improvement_projects_profile on public.improvement_projects(profile_id);

create trigger trg_improvement_projects_updated before update on public.improvement_projects
  for each row execute procedure public.set_updated_at();

alter table public.improvement_projects enable row level security;

create policy "improvement_projects_select_own" on public.improvement_projects for select using (user_id = (select auth.uid()));
create policy "improvement_projects_insert_own" on public.improvement_projects for insert with check (user_id = (select auth.uid()));
create policy "improvement_projects_update_own" on public.improvement_projects for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "improvement_projects_delete_own" on public.improvement_projects for delete using (user_id = (select auth.uid()));
