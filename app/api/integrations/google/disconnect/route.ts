import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createIntegrationManager } from "@/lib/integrations";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    await manager.google.disconnect(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to disconnect Google";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
