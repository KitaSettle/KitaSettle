import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

export function createScriptClient() {
  const key = env.supabaseServiceRoleKey ?? env.supabaseAnonKey;
  return createClient(env.supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
