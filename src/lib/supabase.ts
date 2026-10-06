import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "https://khizjnhphngxbzveiguv.supabase.co";
// Chave pública (publishable): o acesso real aos dados é imposto por RLS no Postgres.
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_V5MgErvWJRFlqy3szbCUSg_nGKAc4jQ";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});
