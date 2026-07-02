import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/config/env";

export function createScriptClient() {
  if (env.isProduction && !env.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server scripts in production.");
  }

  const key = env.supabaseServiceRoleKey ?? env.supabaseAnonKey;
  if (!isSupabaseConfigured()) {
    return createClient(env.supabaseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  if (!env.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required when Supabase is configured.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
