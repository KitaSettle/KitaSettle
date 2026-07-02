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
    await manager.google.disconnect(userId);
    await writeAudit(userId, "integration_disconnect", "google", "disconnect", {}, request);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect Google";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
