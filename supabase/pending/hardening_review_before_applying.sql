-- NÃO APLICADA. Revise antes de rodar (o banco tem usuários reais).
-- Cada bloco é independente. Valide os CHECKs contra os dados existentes antes (use "not valid" + "validate constraint" se preferir).

-- 1) Menor privilégio: anon não precisa de nada (o app exige login); authenticated sem TRUNCATE/TRIGGER/REFERENCES.
revoke all on all tables in schema public from anon;
revoke truncate, trigger, references on all tables in schema public from authenticated;
alter default privileges in schema public revoke all on tables from anon;

-- 2) O usuário não deve poder alterar o próprio plano/feature_flags (hoje a policy de UPDATE permite qualquer coluna).
revoke update on public.profiles from authenticated;
grant update (display_name, institution, course, semester_start, semester_end, monthly_income_goal) on public.profiles to authenticated;

-- 3) Integridade de propriedade: IDs de conta/categoria/perfil referenciados precisam pertencer ao mesmo usuário
--    (as policies de RLS só checam user_id da própria linha, não das referências).
create or replace function public.enforce_row_ownership()
returns trigger language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from spending_profiles s where s.id = new.profile_id and s.user_id = new.user_id) then
    raise exception 'profile does not belong to user';
  end if;
  if tg_table_name in ('transactions','recurring_transactions') then
    if not exists (select 1 from accounts a where a.id = new.account_id and a.user_id = new.user_id) then raise exception 'account does not belong to user'; end if;
    if new.category_id is not null and not exists (select 1 from categories c where c.id = new.category_id and c.user_id = new.user_id) then raise exception 'category does not belong to user'; end if;
  end if;
  if tg_table_name = 'transactions' and new.transfer_account_id is not null
     and not exists (select 1 from accounts a where a.id = new.transfer_account_id and a.user_id = new.user_id) then raise exception 'transfer account does not belong to user'; end if;
  if tg_table_name = 'budgets' and not exists (select 1 from categories c where c.id = new.category_id and c.user_id = new.user_id) then raise exception 'category does not belong to user'; end if;
  if tg_table_name = 'goals' and new.account_id is not null and not exists (select 1 from accounts a where a.id = new.account_id and a.user_id = new.user_id) then raise exception 'account does not belong to user'; end if;
  return new;
end $$;
revoke execute on function public.enforce_row_ownership() from public, anon, authenticated;

do $$ declare t text; begin
  foreach t in array array['transactions','recurring_transactions','accounts','categories','tags','budgets','goals'] loop
    execute format('drop trigger if exists trg_%1$s_ownership on public.%1$s', t);
    execute format('create trigger trg_%1$s_ownership before insert or update on public.%1$s for each row execute function public.enforce_row_ownership()', t);
  end loop;
end $$;

-- tags: só associar tag e transação do próprio usuário
drop policy if exists transaction_tags_insert_own on public.transaction_tags;
create policy transaction_tags_insert_own on public.transaction_tags for insert to authenticated
  with check (exists (select 1 from transactions t where t.id = transaction_id and t.user_id = (select auth.uid()))
          and exists (select 1 from tags g where g.id = tag_id and g.user_id = (select auth.uid())));

-- 4) Limites de sanidade
alter table public.transactions add constraint transactions_amount_max check (amount < 1000000000),
  add constraint transactions_desc_len check (char_length(description) <= 200),
  add constraint transactions_notes_len check (notes is null or char_length(notes) <= 1000);

-- 5) Índices de FK
create index if not exists idx_transactions_profile on public.transactions(profile_id);
create index if not exists idx_transactions_transfer on public.transactions(transfer_account_id);
create index if not exists idx_transaction_tags_tag on public.transaction_tags(tag_id);
create index if not exists idx_categories_profile on public.categories(profile_id);
create index if not exists idx_budgets_profile on public.budgets(profile_id);

-- 6) Novos usuários recebem categorias de universitário (usuários existentes não são afetados).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_profile_id uuid;
begin
  insert into profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)), 80));
  insert into spending_profiles (user_id, name, is_default) values (new.id, 'Pessoal', true) returning id into v_profile_id;
  insert into accounts (user_id, profile_id, name, type, color, icon)
  values (new.id, v_profile_id, 'Carteira', 'cash', '#16a34a', 'wallet'), (new.id, v_profile_id, 'Conta corrente', 'checking', '#2563eb', 'landmark');
  insert into categories (user_id, profile_id, name, kind, nature, color, icon) values
    (new.id, v_profile_id, 'Mesada / Família', 'income', 'fixed', '#16a34a', 'banknote'),
    (new.id, v_profile_id, 'Bolsa / Auxílio', 'income', 'fixed', '#22c55e', 'graduation-cap'),
    (new.id, v_profile_id, 'Estágio / Trabalho', 'income', 'fixed', '#84cc16', 'briefcase'),
    (new.id, v_profile_id, 'Outras receitas', 'income', 'variable', '#65a30d', 'plus-circle'),
    (new.id, v_profile_id, 'Mensalidade', 'expense', 'fixed', '#8b5cf6', 'graduation-cap'),
    (new.id, v_profile_id, 'Material e livros', 'expense', 'variable', '#a855f7', 'book'),
    (new.id, v_profile_id, 'Xerox e impressão', 'expense', 'variable', '#c084fc', 'printer'),
    (new.id, v_profile_id, 'Moradia / República', 'expense', 'fixed', '#f97316', 'home'),
    (new.id, v_profile_id, 'Alimentação', 'expense', 'variable', '#f59e0b', 'utensils'),
    (new.id, v_profile_id, 'Transporte', 'expense', 'variable', '#3b82f6', 'bus'),
    (new.id, v_profile_id, 'Saúde', 'expense', 'variable', '#ef4444', 'heart-pulse'),
    (new.id, v_profile_id, 'Lazer e social', 'expense', 'variable', '#ec4899', 'sparkles'),
    (new.id, v_profile_id, 'Assinaturas', 'expense', 'fixed', '#06b6d4', 'repeat'),
    (new.id, v_profile_id, 'Outros', 'expense', 'variable', '#64748b', 'tag');
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
