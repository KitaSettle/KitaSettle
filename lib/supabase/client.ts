import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "@/lib/config/runtime-public";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
