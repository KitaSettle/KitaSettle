import { NextResponse } from "next/server";
import { env, getAIProviderMode, getDataMode, isGoogleOAuthConfigured, isOpenAIConfigured, isSupabaseConfigured } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dataMode = getDataMode();
  const aiProviderMode = getAIProviderMode();

  return NextResponse.json({
    status: "ok",
    service: env.appName,
    environment: env.appEnv,
    nodeEnv: env.nodeEnv,
    dataMode,
    supabaseConfigured: isSupabaseConfigured(),
    aiProvider: aiProviderMode,
    openaiConfigured: isOpenAIConfigured(),
    googleOAuthConfigured: isGoogleOAuthConfigured(),
    timestamp: new Date().toISOString(),
    modules: {
      ui: "operational",
      executiveBrain: "operational",
      knowledgeEngine: dataMode,
      memoryEngine: dataMode,
      researchPipeline: dataMode,
      trustedSources: dataMode,
      aiProvider: aiProviderMode,
      multiAgent: aiProviderMode === "openai" ? "openai" : "mock",
      auth: dataMode === "supabase" ? "supabase" : "mock",
      executiveConnect: isGoogleOAuthConfigured() ? "google-oauth-ready" : "mock-seeded",
    },
    limitations: [
      aiProviderMode === "mock"
        ? "AI responses use MockAIProvider — set OPENAI_API_KEY for live OpenAI"
        : "Executive briefs and research summaries use OpenAI",
      "Research crawler uses seeded content only",
      dataMode === "mock"
        ? "Running in mock data mode — configure Supabase env vars for persistence"
        : "Supabase connected — data persists per authenticated user",
    ],
  });
}
