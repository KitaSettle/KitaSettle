import type { Repositories } from "@/lib/repositories";
import type { UpsertDocumentIndexInput } from "@/lib/types/executive-connect";
import {
  fetchGoogleDriveFilesInFolder,
  fetchGoogleDriveFolders,
  isGoogleOAuthConfigured,
  refreshGoogleAccessToken,
} from "./google-oauth";
import { generateDocumentSummary, generateEmbedding } from "./embeddings";

export class DocumentService {
  constructor(private repos: Repositories) {}

  async listFolders(userId: string) {
    return this.repos.documents.listFolders(userId, "google");
  }

  async listRequiringReview(userId: string) {
    return this.repos.documents.listRequiringReview(userId, 8, "google");
  }

  async setSelectedFolders(userId: string, externalIds: string[]) {
    await this.repos.documents.setSelectedFolders(userId, "google", externalIds);
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

  async discoverFolders(userId: string): Promise<number> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return 0;

    const response = await fetchGoogleDriveFolders(accessToken);
    const folders = (response.files ?? []).map((file) => ({
      externalId: file.id,
      name: file.name ?? "Untitled folder",
      selected: false,
      lastIndexedAt: null,
    }));

    await this.repos.documents.saveFolders(userId, "google", folders);
    return folders.length;
  }

  async syncSelectedFolders(userId: string): Promise<number> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return 0;

    const selectedFolders = await this.repos.documents.listSelectedFolders(userId, "google");
    if (selectedFolders.length === 0) return 0;

    let total = 0;

    for (const folder of selectedFolders) {
      const response = await fetchGoogleDriveFilesInFolder(accessToken, folder.externalId);
      const documents: UpsertDocumentIndexInput[] = [];

      for (const file of response.files ?? []) {
        const existing = await this.repos.documents.getByExternalId(userId, file.id, "google");
        const modifiedAt = file.modifiedTime ?? null;

        if (existing?.modifiedAt && modifiedAt && existing.modifiedAt >= modifiedAt) {
          continue;
        }

        const summary = await generateDocumentSummary(file.name ?? "Document", file.mimeType);
        const embedding = await generateEmbedding(`${file.name ?? "Document"} ${summary}`);

        documents.push({
          externalId: file.id,
          folderExternalId: folder.externalId,
          name: file.name ?? "Untitled document",
          mimeType: file.mimeType ?? null,
          modifiedAt,
          webViewLink: file.webViewLink ?? null,
          sizeBytes: file.size ? Number(file.size) : null,
          embedding,
          summary,
          requiresReview: /proposal|board|contract|review|approval/i.test(file.name ?? ""),
        });
      }

      total += await this.repos.documents.upsertDocuments(userId, "google", documents);
    }

    return total;
  }
}
