import { NextResponse } from "next/server";
import { env, getDataMode, isSupabaseConfigured } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dataMode = getDataMode();

  return NextResponse.json({
    status: "ok",
    service: env.appName,
    environment: env.appEnv,
    nodeEnv: env.nodeEnv,
    dataMode,
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
    modules: {
      ui: "operational",
      executiveBrain: "operational",
      knowledgeEngine: dataMode,
      memoryEngine: dataMode,
      researchPipeline: dataMode,
      trustedSources: dataMode,
      aiProvider: "mock",
      multiAgent: "mock",
      auth: dataMode === "supabase" ? "supabase" : "mock",
    },
    limitations: [
      "AI responses are mock-generated (no OpenAI yet)",
      "Research crawler uses seeded content only",
      dataMode === "mock"
        ? "Running in mock data mode — configure Supabase env vars for persistence"
        : "Supabase connected — data persists per authenticated user",
    ],
  });
}
