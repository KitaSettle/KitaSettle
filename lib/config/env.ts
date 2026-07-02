/**
 * Typed environment configuration for KitaSettle.
 * Client-safe values use NEXT_PUBLIC_ prefix.
 *
 * IMPORTANT: Public env vars must use direct `process.env.NEXT_PUBLIC_*` reads.
 * Dynamic `process.env[name]` lookups are not inlined by Next.js and break auth.
 */

import { resolvePublicEnv } from "./runtime-public";

function readServer(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readDirectPublic(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  appName: readDirectPublic(process.env.NEXT_PUBLIC_APP_NAME, "KitaSettle Alpha"),
  appEnv: readDirectPublic(process.env.NEXT_PUBLIC_APP_ENV, "alpha"),
  appUrl: readDirectPublic(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),

  supabaseUrl: readDirectPublic(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "https://placeholder.supabase.co",
  ),
  supabaseAnonKey: readDirectPublic(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "placeholder-anon-key",
  ),
  supabaseServiceRoleKey: readServer("SUPABASE_SERVICE_ROLE_KEY"),

  openaiApiKey: readServer("OPENAI_API_KEY"),
  openaiModel: readServer("OPENAI_MODEL") ?? "gpt-4o-mini",
  anthropicApiKey: readServer("ANTHROPIC_API_KEY"),
  googleAiApiKey: readServer("GOOGLE_AI_API_KEY"),
  googleClientId: readServer("GOOGLE_CLIENT_ID"),
  googleClientSecret: readServer("GOOGLE_CLIENT_SECRET"),

  adminUserIds: readServer("ADMIN_USER_IDS"),
  adminEmails: readServer("ADMIN_EMAILS"),
} as const;

export function getPublicEnv() {
  assertServerSecretsNotPublic();
  return {
    appName: env.appName,
    appEnv: env.appEnv,
    appUrl: env.appUrl,
    supabaseUrl: env.supabaseUrl,
    supabaseAnonKey: env.supabaseAnonKey,
    dataMode: getDataMode(),
  };
}

export function assertServerSecretsNotPublic(): void {
  const forbiddenPublicKeys = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "GOOGLE_CLIENT_SECRET",
    "ANTHROPIC_API_KEY",
  ];

  for (const key of forbiddenPublicKeys) {
    if (process.env[`NEXT_PUBLIC_${key}`]) {
      throw new Error(`${key} must never be exposed via NEXT_PUBLIC_ variables.`);
    }
  }
}

const PLACEHOLDER_URL_MARKERS = ["placeholder", "your-project.supabase.co"];
const PLACEHOLDER_KEY_MARKERS = ["placeholder", "your-anon-key"];

function isValidSupabaseConfig(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return false;
  if (PLACEHOLDER_URL_MARKERS.some((marker) => url.includes(marker))) return false;
  if (PLACEHOLDER_KEY_MARKERS.some((marker) => anonKey.includes(marker))) return false;
  return true;
}

export function isSupabaseConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = resolvePublicEnv();
  return isValidSupabaseConfig(supabaseUrl, supabaseAnonKey);
}

export type DataMode = "supabase" | "mock";

export function getDataMode(): DataMode {
  return isSupabaseConfigured() ? "supabase" : "mock";
}

const PLACEHOLDER_OPENAI_KEY_MARKERS = ["placeholder", "your-openai-api-key", "sk-your"];

export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return false;
  if (PLACEHOLDER_OPENAI_KEY_MARKERS.some((marker) => apiKey.includes(marker))) return false;
  if (!apiKey.startsWith("sk-")) return false;
  return true;
}

export type AIProviderMode = "openai" | "mock";

export function getAIProviderMode(): AIProviderMode {
  return isOpenAIConfigured() ? "openai" : "mock";
}

export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return false;
  if (clientId.includes("your-google-client-id") || clientSecret.includes("your-google-client-secret")) {
    return false;
  }
  return true;
}

function resolveProductionAppUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit?.startsWith("http")) return explicit;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return undefined;
}

export function getProductionEnvIssues(): string[] {
  if (!env.isProduction) return [];

  const issues: string[] = [];

  try {
    assertServerSecretsNotPublic();
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "Server secret exposed via NEXT_PUBLIC_.");
  }

  if (!resolveProductionAppUrl()) {
    issues.push("NEXT_PUBLIC_APP_URL must be set for production deployments.");
  }

  if (isSupabaseConfigured() && !env.supabaseServiceRoleKey) {
    issues.push(
      "SUPABASE_SERVICE_ROLE_KEY is required in production when Supabase is configured.",
    );
  }

  return issues;
}

export function assertProductionEnv(): void {
  const issues = getProductionEnvIssues();
  if (issues.length > 0) {
    throw new Error(issues.join(" "));
  }
}
