/**
 * Typed environment configuration for KitaSettle.
 * Client-safe values use NEXT_PUBLIC_ prefix.
 */

function readPublic(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function readServer(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  appName: readPublic("NEXT_PUBLIC_APP_NAME", "KitaSettle Alpha"),
  appEnv: readPublic("NEXT_PUBLIC_APP_ENV", "alpha"),
  appUrl: readPublic("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

  supabaseUrl: readPublic(
    "NEXT_PUBLIC_SUPABASE_URL",
    "https://placeholder.supabase.co",
  ),
  supabaseAnonKey: readPublic(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "placeholder-anon-key",
  ),
  supabaseServiceRoleKey: readServer("SUPABASE_SERVICE_ROLE_KEY"),

  openaiApiKey: readServer("OPENAI_API_KEY"),
  anthropicApiKey: readServer("ANTHROPIC_API_KEY"),
  googleAiApiKey: readServer("GOOGLE_AI_API_KEY"),
} as const;

export function getPublicEnv() {
  return {
    appName: env.appName,
    appEnv: env.appEnv,
    appUrl: env.appUrl,
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    dataMode: getDataMode(),
  };
}

const PLACEHOLDER_URL_MARKERS = ["placeholder", "your-project.supabase.co"];
const PLACEHOLDER_KEY_MARKERS = ["placeholder", "your-anon-key"];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return false;
  if (PLACEHOLDER_URL_MARKERS.some((marker) => url.includes(marker))) return false;
  if (PLACEHOLDER_KEY_MARKERS.some((marker) => anonKey.includes(marker))) return false;

  return true;
}

export type DataMode = "supabase" | "mock";

export function getDataMode(): DataMode {
  return isSupabaseConfigured() ? "supabase" : "mock";
}

export function assertProductionEnv(): void {
  if (!env.isProduction) return;

  if (!process.env.NEXT_PUBLIC_APP_URL?.trim()?.startsWith("http")) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set for production deployments.");
  }
}
