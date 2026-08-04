import { createClient } from "@supabase/supabase-js";

/** Client escopado ao usuário da requisição — o RLS do Postgres decide o que pode ser lido/escrito. */
export function supabaseForRequest(supabaseUrl: string, anonKey: string, accessToken: string) {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}
