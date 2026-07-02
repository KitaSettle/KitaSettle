import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { createIntegrationManager, isGoogleOAuthConfigured } from "@/lib/integrations";
import { getDataMode } from "@/lib/config/env";
import { createOAuthState } from "@/lib/integrations/oauth-state";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireAuthenticatedUser(request, "integration");
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);

    if (!isGoogleOAuthConfigured()) {
      if (getDataMode() === "mock") {
        await manager.google.mockConnect(userId);
        await writeAudit(userId, "integration_connect", "google", "mock_connect", {}, request);
        return NextResponse.redirect(new URL("/dashboard/executive?connected=google", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
      }
      return NextResponse.json(
        { error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
        { status: 503 },
      );
    }

    const state = await createOAuthState(userId);
    await writeAudit(userId, "integration_connect", "google", "oauth_start", {}, request);
    const url = manager.google.getConnectUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start Google connect";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
