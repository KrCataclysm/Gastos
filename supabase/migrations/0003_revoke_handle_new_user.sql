-- APLICADA em produção. Só o trigger de auth deve executar esta função.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
