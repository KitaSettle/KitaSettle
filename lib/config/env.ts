/**
 * Typed environment configuration for KitaSettle.
 * Client-safe values use NEXT_PUBLIC_ prefix.
 * Server secrets are read only on the server and remain optional in Alpha.
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

  /** Future provider keys — not used in Alpha mock mode */
  openaiApiKey: readServer("OPENAI_API_KEY"),
  anthropicApiKey: readServer("ANTHROPIC_API_KEY"),
  googleAiApiKey: readServer("GOOGLE_AI_API_KEY"),
} as const;

export function getPublicEnv() {
  return {
    appName: env.appName,
    appEnv: env.appEnv,
    appUrl: env.appUrl,
  };
}

export function assertProductionEnv(): void {
  if (!env.isProduction) return;

  if (!env.appUrl.startsWith("http")) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set for production deployments.");
  }
}
