import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConnectProvider,
  EmailClassification,
  StoredEmailMetadata,
  UpsertEmailMetadataInput,
} from "@/lib/types/executive-connect";
import { nowIso } from "@/lib/utils";

export interface EmailRepository {
  upsertMessages(
    userId: string,
    provider: ConnectProvider,
    messages: UpsertEmailMetadataInput[],
  ): Promise<number>;
  listImportant(userId: string, limit?: number, provider?: ConnectProvider): Promise<StoredEmailMetadata[]>;
  listByClassification(
    userId: string,
    classification: EmailClassification,
    limit?: number,
    provider?: ConnectProvider,
  ): Promise<StoredEmailMetadata[]>;
  listRecent(userId: string, limit?: number, provider?: ConnectProvider): Promise<StoredEmailMetadata[]>;
  saveBody(userId: string, externalId: string, body: string, provider?: ConnectProvider): Promise<void>;
}

function mapEmail(row: Record<string, unknown>): StoredEmailMetadata {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as ConnectProvider,
    externalId: row.external_id as string,
    threadId: (row.thread_id as string | null) ?? null,
    subject: row.subject as string,
    sender: row.sender as string,
    snippet: (row.snippet as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    storeBody: Boolean(row.store_body),
    receivedAt: row.received_at as string,
    classification: row.classification as EmailClassification,
    labels: (row.labels ?? []) as string[],
    isImportant: Boolean(row.is_important),
    isRead: Boolean(row.is_read),
    updatedAt: row.updated_at as string,
  };
}

export class SupabaseEmailRepository implements EmailRepository {
  constructor(private client: SupabaseClient) {}

  async upsertMessages(
    userId: string,
    provider: ConnectProvider,
    messages: UpsertEmailMetadataInput[],
  ): Promise<number> {
    if (messages.length === 0) return 0;

    const rows = messages.map((message) => ({
      user_id: userId,
      provider,
      external_id: message.externalId,
      thread_id: message.threadId ?? null,
      subject: message.subject,
      sender: message.sender,
      snippet: message.snippet ?? null,
      body: message.storeBody ? message.body ?? null : null,
      store_body: message.storeBody ?? false,
      received_at: message.receivedAt,
      classification: message.classification,
      labels: message.labels ?? [],
      is_important: message.isImportant ?? false,
      is_read: message.isRead ?? true,
      raw_metadata: message.rawMetadata ?? {},
      updated_at: nowIso(),
    }));

    const { error } = await this.client
      .from("email_metadata")
      .upsert(rows, { onConflict: "user_id,provider,external_id" });
    if (error) throw error;
    return rows.length;
  }

  async listImportant(userId: string, limit = 10, provider?: ConnectProvider): Promise<StoredEmailMetadata[]> {
    let query = this.client
      .from("email_metadata")
      .select("*")
      .eq("user_id", userId)
      .or("is_important.eq.true,classification.in.(urgent,approvals,finance,meetings)")
      .order("received_at", { ascending: false })
      .limit(limit);

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEmail);
  }

  async listByClassification(
    userId: string,
    classification: EmailClassification,
    limit = 20,
    provider?: ConnectProvider,
  ): Promise<StoredEmailMetadata[]> {
    let query = this.client
      .from("email_metadata")
      .select("*")
      .eq("user_id", userId)
      .eq("classification", classification)
      .order("received_at", { ascending: false })
      .limit(limit);

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEmail);
  }

  async listRecent(userId: string, limit = 20, provider?: ConnectProvider): Promise<StoredEmailMetadata[]> {
    let query = this.client
      .from("email_metadata")
      .select("*")
      .eq("user_id", userId)
      .order("received_at", { ascending: false })
      .limit(limit);

    if (provider) query = query.eq("provider", provider);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapEmail);
  }

  async saveBody(
    userId: string,
    externalId: string,
    body: string,
    provider: ConnectProvider = "google",
  ): Promise<void> {
    const { error } = await this.client
      .from("email_metadata")
      .update({ body, store_body: true, updated_at: nowIso() })
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("external_id", externalId);
    if (error) throw error;
  }
}
