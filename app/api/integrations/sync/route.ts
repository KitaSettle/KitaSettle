import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { createIntegrationManager } from "@/lib/integrations";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await requireAuthenticatedUser(request, "integration");
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    const result = await manager.scheduler.runAll(userId);
    await writeAudit(userId, "data_access", "integrations", "sync", {}, request);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
