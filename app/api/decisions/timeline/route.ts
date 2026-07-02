import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { createDecisionEngine } from "@/lib/decision-engine";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const engine = createDecisionEngine(repos);
    const timeline = await engine.getTimeline(userId);
    await writeAudit(userId, "data_access", "decision_timeline", "list", {}, request);
    return NextResponse.json(timeline);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load decision timeline";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
