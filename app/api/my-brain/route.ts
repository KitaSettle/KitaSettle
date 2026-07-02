import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createBrainInsightsService } from "@/lib/brain-insights";
import { getServerRepositories } from "@/lib/repositories/server";
import { getTransparencyRepository } from "@/lib/repositories/transparency-factory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const transparency = await getTransparencyRepository();
    const service = createBrainInsightsService(repos, transparency);
    const payload = await service.getInsights(userId);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load My Brain";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
