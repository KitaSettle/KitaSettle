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
      knowledgeEngine: "mock",
      memoryEngine: "mock",
      researchPipeline: "mock",
      aiProvider: "mock",
      multiAgent: "mock",
    },
    limitations: [
      "Alpha uses mock authentication (session storage)",
      "No live AI API connections",
      "No database persistence",
      "Local JSON stores are runtime-only",
    ],
  });
}
