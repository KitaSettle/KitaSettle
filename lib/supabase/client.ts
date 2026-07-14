import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserConfig } from "@/lib/config/runtime-public";

// Must be a singleton: each createBrowserClient() call spins up its own
// GoTrueClient with its own auto-refresh timer and auth listeners. Multiple
// instances against the same cookies race each other -- one instance's
// token refresh can make another perceive the session as signed out
// mid-use, which surfaces as random "disconnects" during normal use.
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const { supabaseUrl, supabaseAnonKey } = getSupabaseBrowserConfig();
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
