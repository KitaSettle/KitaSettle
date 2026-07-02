import { NextResponse } from "next/server";
import { createIntegrationManager } from "@/lib/integrations";
import { env } from "@/lib/config/env";
import { verifyOAuthState } from "@/lib/integrations/oauth-state";
import { getServerRepositories } from "@/lib/repositories/server";
import { enforceRateLimit, writeAudit } from "@/lib/security/secure-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, null, "integration");
  if (limited) return limited;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${env.appUrl}/dashboard/executive?connectError=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${env.appUrl}/dashboard/executive?connectError=missing_code`);
  }

  try {
    const userId = await verifyOAuthState(state);
    if (!userId) {
      return NextResponse.redirect(`${env.appUrl}/dashboard/executive?connectError=invalid_state`);
    }

    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    await manager.google.completeOAuth(userId, code);
    await writeAudit(userId, "integration_connect", "google", "oauth_complete", {}, request);
    return NextResponse.redirect(`${env.appUrl}/dashboard/executive?connected=google`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(`${env.appUrl}/dashboard/executive?connectError=${encodeURIComponent(message)}`);
  }
}
