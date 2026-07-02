import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { createIntegrationManager } from "@/lib/integrations";
import { recordOperationalError } from "@/lib/observability/record-error";
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
    await writeAudit(userId, "data_access", "integrations", "sync", { ok: true }, request);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await recordOperationalError({
      source: "integrations.sync",
      message,
      userId,
      retryable: true,
    });
    return NextResponse.json({ error: "Sync could not complete. Please try again shortly." }, { status: 500 });
  }
}
