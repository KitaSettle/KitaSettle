import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: env.appName,
    environment: env.appEnv,
    nodeEnv: env.nodeEnv,
    timestamp: new Date().toISOString(),
    modules: {
      ui: "operational",
      executiveBrain: "operational",
      knowledgeEngine: "supabase",
      memoryEngine: "supabase",
      researchPipeline: "supabase",
      aiProvider: "mock",
      multiAgent: "mock",
      auth: "supabase",
    },
    limitations: [
      "AI responses are mock-generated (no OpenAI yet)",
      "Research crawler uses seeded content only",
      "Configure Supabase env vars for full persistence",
    ],
  });
}
