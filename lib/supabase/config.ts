import {
  env,
  getDataMode,
  getPublicEnv,
  isSupabaseConfigured,
  type DataMode,
} from "@/lib/config/env";

export { env, getDataMode, getPublicEnv, isSupabaseConfigured, type DataMode };

export function getSupabaseProjectUrl(): string | null {
  if (!isSupabaseConfigured()) return null;
  return env.supabaseUrl;
}
