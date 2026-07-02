import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createIntegrationManager } from "@/lib/integrations";
import { withConnectFallback, EMPTY_CONNECT_SNAPSHOT } from "@/lib/integrations/defaults";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    const integrations = await withConnectFallback(
      () => manager.listStatus(userId),
      EMPTY_CONNECT_SNAPSHOT.integrations,
    );
    return NextResponse.json({ integrations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load integrations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
