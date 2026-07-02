import type { Repositories } from "@/lib/repositories";
import type { UpsertEmailMetadataInput } from "@/lib/types/executive-connect";
import {
  fetchGoogleGmailMessage,
  fetchGoogleGmailMessages,
  isGoogleOAuthConfigured,
  refreshGoogleAccessToken,
} from "./google-oauth";
import { classifyEmail } from "./classifiers";

function headerValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string,
): string {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export class EmailService {
  constructor(private repos: Repositories) {}

  async listImportant(userId: string) {
    return this.repos.email.listImportant(userId, 8, "google");
  }

  private async getAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.repos.integrations.getTokens(userId, "google");
    if (!tokens?.accessToken) return null;

    if (tokens.tokenExpiresAt && new Date(tokens.tokenExpiresAt).getTime() > Date.now() + 60_000) {
      return tokens.accessToken;
    }

    if (!tokens.refreshToken || !isGoogleOAuthConfigured()) return tokens.accessToken;

    const refreshed = await refreshGoogleAccessToken(tokens.refreshToken);
    await this.repos.integrations.saveTokens(userId, "google", {
      accessToken: refreshed.access_token,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      scopes: tokens.scopes,
      accountEmail: tokens.accountEmail,
    });
    return refreshed.access_token;
  }

  async syncFromGoogle(userId: string): Promise<number> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return 0;

    const list = await fetchGoogleGmailMessages(accessToken, 25);
    const messages: UpsertEmailMetadataInput[] = [];

    for (const item of list.messages ?? []) {
      const detail = await fetchGoogleGmailMessage(accessToken, item.id);
      const subject = headerValue(detail.payload?.headers, "Subject");
      const sender = headerValue(detail.payload?.headers, "From");
      const labels = detail.labelIds ?? [];
      const classification = classifyEmail({ subject, sender, snippet: detail.snippet, labels });

      messages.push({
        externalId: detail.id,
        threadId: detail.threadId ?? null,
        subject: subject || "(No subject)",
        sender: sender || "Unknown sender",
        snippet: detail.snippet ?? null,
        receivedAt: detail.internalDate
          ? new Date(Number(detail.internalDate)).toISOString()
          : new Date().toISOString(),
        classification,
        labels,
        isImportant: labels.includes("IMPORTANT") || classification === "urgent",
        isRead: !labels.includes("UNREAD"),
        storeBody: false,
      });
    }

    return this.repos.email.upsertMessages(userId, "google", messages);
  }
}
