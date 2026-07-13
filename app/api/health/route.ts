import { NextResponse } from "next/server";
import {
  env,
  getAIProviderMode,
  getDataMode,
  getProductionEnvIssues,
  isGoogleOAuthConfigured,
  isOpenAIConfigured,
  isSupabaseConfigured,
} from "@/lib/config/env";
import { getSchemaHealthReport } from "@/lib/database/schema-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function probeSupabase(): Promise<"ok" | "degraded" | "down"> {
  if (!isSupabaseConfigured()) return "down";
  try {
    const response = await fetch(`${env.supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: { apikey: env.supabaseAnonKey, Authorization: `Bearer ${env.supabaseAnonKey}` },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? "ok" : "degraded";
  } catch {
    return "down";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const full = url.searchParams.get("full") === "1";

  if (!full) {
    if (env.isProduction) {
      return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "ok",
      service: env.appName,
      environment: env.appEnv,
      dataMode: getDataMode(),
      timestamp: new Date().toISOString(),
    });
  }

  const [supabase, openaiConfigured, googleConfigured, schema] = await Promise.all([
    probeSupabase(),
    Promise.resolve(isOpenAIConfigured()),
    Promise.resolve(isGoogleOAuthConfigured()),
    getSchemaHealthReport(),
  ]);

  const envIssues = getProductionEnvIssues();
  const checks = {
    supabase,
    schemaReady: schema.ready,
    missingTables: schema.missingTables.length > 0 ? schema.missingTables : undefined,
    openai: openaiConfigured ? "configured" : "mock",
    google: googleConfigured ? "configured" : "offline",
    aiProvider: getAIProviderMode(),
    dataMode: getDataMode(),
    envIssues: envIssues.length > 0 ? envIssues : undefined,
  };

  const degraded =
    supabase !== "ok" ||
    !schema.ready ||
    envIssues.length > 0 ||
    (!openaiConfigured && env.isProduction);

  return NextResponse.json({
    status: degraded ? "degraded" : "ok",
    checks,
    timestamp: new Date().toISOString(),
  });
}
