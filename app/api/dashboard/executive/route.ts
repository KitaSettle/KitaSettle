import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { generateIfMissing } from "@/lib/executive/daily-brief-service";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireAuthenticatedUser(request, "ai");
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const payload = await generateIfMissing(userId, repos);
    await writeAudit(userId, "ai_generation", "executive_briefs", "generate", {}, request);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load daily executive brief";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
