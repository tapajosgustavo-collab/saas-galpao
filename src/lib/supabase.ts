import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Cliente Supabase server-only com a service_role key.
 * NUNCA importar este modulo em codigo client (a key nunca deve sair do servidor).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL/SERVICE_ROLE_KEY nao configuradas");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET ?? "fotos";
