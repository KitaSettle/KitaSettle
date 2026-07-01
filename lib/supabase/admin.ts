import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

export function createAdminClient() {
  const serviceRoleKey = env.supabaseServiceRoleKey;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations.");
  }

  return createSupabaseClient(env.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
