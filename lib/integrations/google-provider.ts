import type { Repositories } from "@/lib/repositories";
import type { ConnectService } from "@/lib/types/executive-connect";
import {
  exchangeGoogleCode,
  fetchGoogleAccountEmail,
  getGoogleOAuthUrl,
  GOOGLE_SCOPES,
  isGoogleOAuthConfigured,
} from "./google-oauth";
import { SyncScheduler } from "./sync-scheduler";
import { nowIso } from "@/lib/utils";

export class GoogleProvider {
  constructor(private repos: Repositories) {}

  isConfigured(): boolean {
    return isGoogleOAuthConfigured();
  }

  getConnectUrl(state: string): string {
    if (!isGoogleOAuthConfigured()) {
      throw new Error("Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    }
    return getGoogleOAuthUrl(state);
  }

  async completeOAuth(userId: string, code: string): Promise<void> {
    const tokenResponse = await exchangeGoogleCode(code);
    const accountEmail = await fetchGoogleAccountEmail(tokenResponse.access_token);
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();

    await this.repos.integrations.saveTokens(userId, "google", {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      tokenExpiresAt: expiresAt,
      scopes: tokenResponse.scope.split(" "),
      accountEmail,
    });

    await this.repos.integrations.upsertConnection(userId, "google", {
      status: "connected",
      services: ["calendar", "gmail", "drive"],
      accountEmail,
      scopes: GOOGLE_SCOPES,
      lastSyncAt: nowIso(),
      lastSyncStatus: "connected",
    });

    const scheduler = new SyncScheduler(this.repos);
    await scheduler.runAll(userId);
  }

  async mockConnect(userId: string, services: ConnectService[] = ["calendar", "gmail", "drive"]): Promise<void> {
    await this.repos.integrations.saveTokens(userId, "google", {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
      scopes: GOOGLE_SCOPES,
      accountEmail: "executive@kitasettle.com",
    });

    await this.repos.integrations.upsertConnection(userId, "google", {
      status: "connected",
      services,
      accountEmail: "executive@kitasettle.com",
      scopes: GOOGLE_SCOPES,
      lastSyncAt: nowIso(),
      lastSyncStatus: "completed",
    });
  }

  async disconnect(userId: string): Promise<void> {
    await this.repos.integrations.disconnect(userId, "google");
  }
}
