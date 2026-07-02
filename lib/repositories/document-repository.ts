import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConnectProvider,
  DocumentFolder,
  DocumentIndexEntry,
  UpsertDocumentIndexInput,
} from "@/lib/types/executive-connect";
import { nowIso } from "@/lib/utils";

export interface DocumentRepository {
  upsertDocuments(
    userId: string,
    provider: ConnectProvider,
    documents: UpsertDocumentIndexInput[],
  ): Promise<number>;
  listFolders(userId: string, provider?: ConnectProvider): Promise<DocumentFolder[]>;
  saveFolders(userId: string, provider: ConnectProvider, folders: Omit<DocumentFolder, "id" | "userId" | "provider">[]): Promise<DocumentFolder[]>;
  setSelectedFolders(userId: string, provider: ConnectProvider, externalIds: string[]): Promise<void>;
  listSelectedFolders(userId: string, provider?: ConnectProvider): Promise<DocumentFolder[]>;
  listRequiringReview(userId: string, limit?: number, provider?: ConnectProvider): Promise<DocumentIndexEntry[]>;
  listRecent(userId: string, limit?: number, provider?: ConnectProvider): Promise<DocumentIndexEntry[]>;
  getByExternalId(userId: string, externalId: string, provider?: ConnectProvider): Promise<DocumentIndexEntry | null>;
}

function mapFolder(row: Record<string, unknown>): DocumentFolder {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as ConnectProvider,
    externalId: row.external_id as string,
    name: row.name as string,
    selected: Boolean(row.selected),
    lastIndexedAt: (row.last_indexed_at as string | null) ?? null,
  };
}

function mapDocument(row: Record<string, unknown>): DocumentIndexEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as ConnectProvider,
    externalId: row.external_id as string,
    folderExternalId: (row.folder_external_id as string | null) ?? null,
    name: row.name as string,
    mimeType: (row.mime_type as string | null) ?? null,
    modifiedAt: (row.modified_at as string | null) ?? null,
    webViewLink: (row.web_view_link as string | null) ?? null,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    summary: (row.summary as string | null) ?? null,
    requiresReview: Boolean(row.requires_review),
    indexedAt: row.indexed_at as string,
  };
}

export class SupabaseDocumentRepository implements DocumentRepository {
  constructor(private client: SupabaseClient) {}

  async upsertDocuments(
    userId: string,
    provider: ConnectProvider,
    documents: UpsertDocumentIndexInput[],
  ): Promise<number> {
    if (documents.length === 0) return 0;

    const rows = documents.map((doc) => ({
      user_id: userId,
      provider,
      external_id: doc.externalId,
      folder_external_id: doc.folderExternalId ?? null,
      name: doc.name,
      mime_type: doc.mimeType ?? null,
      modified_at: doc.modifiedAt ?? null,
      web_view_link: doc.webViewLink ?? null,
      size_bytes: doc.sizeBytes ?? null,
      embedding: doc.embedding ?? null,
      summary: doc.summary ?? null,
      requires_review: doc.requiresReview ?? false,
      indexed_at: nowIso(),
      updated_at: nowIso(),
    }));

    const { error } = await this.client
      .from("document_index")
      .upsert(rows, { onConflict: "user_id,provider,external_id" });
    if (error) throw error;
    return rows.length;
  }

  async listFolders(userId: string, provider?: ConnectProvider): Promise<DocumentFolder[]> {
    let query = this.client.from("document_folders").select("*").eq("user_id", userId).order("name");
    if (provider) query = query.eq("provider", provider);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapFolder);
  }

  async saveFolders(
    userId: string,
    provider: ConnectProvider,
    folders: Omit<DocumentFolder, "id" | "userId" | "provider">[],
  ): Promise<DocumentFolder[]> {
    const rows = folders.map((folder) => ({
      user_id: userId,
      provider,
      external_id: folder.externalId,
      name: folder.name,
      selected: folder.selected,
      last_indexed_at: folder.lastIndexedAt,
      updated_at: nowIso(),
    }));

    const { data, error } = await this.client
      .from("document_folders")
      .upsert(rows, { onConflict: "user_id,provider,external_id" })
      .select("*");
    if (error) throw error;
    return (data ?? []).map(mapFolder);
  }

  async setSelectedFolders(userId: string, provider: ConnectProvider, externalIds: string[]): Promise<void> {
    await this.client
      .from("document_folders")
      .update({ selected: false, updated_at: nowIso() })
      .eq("user_id", userId)
      .eq("provider", provider);

    if (externalIds.length === 0) return;

    const { error } = await this.client
      .from("document_folders")
      .update({ selected: true, updated_at: nowIso() })
      .eq("user_id", userId)
      .eq("provider", provider)
      .in("external_id", externalIds);
    if (error) throw error;
  }

  async listSelectedFolders(userId: string, provider?: ConnectProvider): Promise<DocumentFolder[]> {
    let query = this.client
      .from("document_folders")
      .select("*")
      .eq("user_id", userId)
      .eq("selected", true);
    if (provider) query = query.eq("provider", provider);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapFolder);
  }

  async listRequiringReview(
    userId: string,
    limit = 10,
    provider?: ConnectProvider,
  ): Promise<DocumentIndexEntry[]> {
    let query = this.client
      .from("document_index")
      .select("*")
      .eq("user_id", userId)
      .eq("requires_review", true)
      .order("modified_at", { ascending: false })
      .limit(limit);
    if (provider) query = query.eq("provider", provider);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapDocument);
  }

  async listRecent(userId: string, limit = 10, provider?: ConnectProvider): Promise<DocumentIndexEntry[]> {
    let query = this.client
      .from("document_index")
      .select("*")
      .eq("user_id", userId)
      .order("modified_at", { ascending: false })
      .limit(limit);
    if (provider) query = query.eq("provider", provider);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapDocument);
  }

  async getByExternalId(
    userId: string,
    externalId: string,
    provider: ConnectProvider = "google",
  ): Promise<DocumentIndexEntry | null> {
    const { data, error } = await this.client
      .from("document_index")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("external_id", externalId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapDocument(data) : null;
  }
}
