-- 0006 · Privacidade e endurecimento (LGPD)
-- 1) O app só usa o banco depois do login (papel "authenticated"). O papel "anon" não precisa de acesso
--    nenhum às tabelas: a RLS já bloqueia, e aqui tiramos também o privilégio (defesa em profundidade).
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- 2) Direito de eliminação (LGPD art. 18, VI): a própria pessoa apaga a conta e TODOS os dados.
--    As chaves estrangeiras têm "on delete cascade", então apagar o usuário apaga o resto.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
