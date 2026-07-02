import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConnectProvider,
  ConnectService,
  IntegrationConnection,
  IntegrationStatusValue,
  SyncJobRecord,
} from "@/lib/types/executive-connect";
import { nowIso } from "@/lib/utils";

export interface IntegrationTokens {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  accountEmail: string | null;
}

export interface IntegrationRepository {
  getConnection(userId: string, provider: ConnectProvider): Promise<IntegrationConnection | null>;
  listConnections(userId: string): Promise<IntegrationConnection[]>;
  upsertConnection(
    userId: string,
    provider: ConnectProvider,
    patch: Partial<IntegrationConnection> & { services?: ConnectService[] },
  ): Promise<IntegrationConnection>;
  saveTokens(userId: string, provider: ConnectProvider, tokens: IntegrationTokens): Promise<void>;
  getTokens(userId: string, provider: ConnectProvider): Promise<IntegrationTokens | null>;
  disconnect(userId: string, provider: ConnectProvider): Promise<void>;
  updateSyncStatus(
    userId: string,
    provider: ConnectProvider,
    status: string,
    error?: string | null,
  ): Promise<void>;
  createSyncJob(
    userId: string,
    provider: ConnectProvider,
    jobType: SyncJobRecord["jobType"],
    metadata?: Record<string, unknown>,
  ): Promise<SyncJobRecord>;
  completeSyncJob(
    jobId: string,
    status: "completed" | "failed",
    error?: string | null,
  ): Promise<void>;
}

function mapConnection(row: Record<string, unknown>): IntegrationConnection {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    provider: row.provider as ConnectProvider,
    services: (row.services ?? []) as ConnectService[],
    status: row.status as IntegrationStatusValue,
    accountEmail: (row.account_email as string | null) ?? null,
    scopes: (row.scopes ?? []) as string[],
    lastSyncAt: (row.last_sync_at as string | null) ?? null,
    lastSyncStatus: (row.last_sync_status as string | null) ?? null,
    lastSyncError: (row.last_sync_error as string | null) ?? null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class SupabaseIntegrationRepository implements IntegrationRepository {
  constructor(private client: SupabaseClient) {}

  async getConnection(userId: string, provider: ConnectProvider): Promise<IntegrationConnection | null> {
    const { data, error } = await this.client
      .from("integration_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw error;
    return data ? mapConnection(data) : null;
  }

  async listConnections(userId: string): Promise<IntegrationConnection[]> {
    const { data, error } = await this.client
      .from("integration_connections")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map(mapConnection);
  }

  async upsertConnection(
    userId: string,
    provider: ConnectProvider,
    patch: Partial<IntegrationConnection> & { services?: ConnectService[] },
  ): Promise<IntegrationConnection> {
    const { data, error } = await this.client
      .from("integration_connections")
      .upsert(
        {
          user_id: userId,
          provider,
          services: patch.services ?? ["calendar", "gmail", "drive"],
          status: patch.status ?? "connected",
          account_email: patch.accountEmail ?? null,
          scopes: patch.scopes ?? [],
          metadata: patch.metadata ?? {},
          last_sync_at: patch.lastSyncAt ?? null,
          last_sync_status: patch.lastSyncStatus ?? null,
          last_sync_error: patch.lastSyncError ?? null,
          updated_at: nowIso(),
        },
        { onConflict: "user_id,provider" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return mapConnection(data);
  }

  async saveTokens(userId: string, provider: ConnectProvider, tokens: IntegrationTokens): Promise<void> {
    const { error } = await this.client.from("integration_connections").upsert(
      {
        user_id: userId,
        provider,
        status: "connected",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.tokenExpiresAt,
        scopes: tokens.scopes,
        account_email: tokens.accountEmail,
        updated_at: nowIso(),
      },
      { onConflict: "user_id,provider" },
    );
    if (error) throw error;
  }

  async getTokens(userId: string, provider: ConnectProvider): Promise<IntegrationTokens | null> {
    const { data, error } = await this.client
      .from("integration_connections")
      .select("access_token, refresh_token, token_expires_at, scopes, account_email, status")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw error;
    if (!data?.access_token) return null;
    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string | null) ?? null,
      tokenExpiresAt: (data.token_expires_at as string | null) ?? null,
      scopes: (data.scopes ?? []) as string[],
      accountEmail: (data.account_email as string | null) ?? null,
    };
  }

  async disconnect(userId: string, provider: ConnectProvider): Promise<void> {
    const { error } = await this.client
      .from("integration_connections")
      .update({
        status: "disconnected",
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        updated_at: nowIso(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);
    if (error) throw error;
  }

  async updateSyncStatus(
    userId: string,
    provider: ConnectProvider,
    status: string,
    errorMessage?: string | null,
  ): Promise<void> {
    const { error } = await this.client
      .from("integration_connections")
      .update({
        last_sync_at: nowIso(),
        last_sync_status: status,
        last_sync_error: errorMessage ?? null,
        updated_at: nowIso(),
      })
      .eq("user_id", userId)
      .eq("provider", provider);
    if (error) throw error;
  }

  async createSyncJob(
    userId: string,
    provider: ConnectProvider,
    jobType: SyncJobRecord["jobType"],
    metadata: Record<string, unknown> = {},
  ): Promise<SyncJobRecord> {
    const { data, error } = await this.client
      .from("sync_jobs")
      .insert({
        user_id: userId,
        provider,
        job_type: jobType,
        status: "running",
        started_at: nowIso(),
        metadata,
      })
      .select("*")
      .single();
    if (error) throw error;
    return {
      id: data.id as string,
      userId,
      provider,
      jobType: data.job_type as SyncJobRecord["jobType"],
      status: data.status as SyncJobRecord["status"],
      startedAt: data.started_at as string,
      completedAt: null,
      error: null,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
      createdAt: data.created_at as string,
    };
  }

  async completeSyncJob(jobId: string, status: "completed" | "failed", errorMessage?: string | null): Promise<void> {
    const { error } = await this.client
      .from("sync_jobs")
      .update({
        status,
        completed_at: nowIso(),
        error: errorMessage ?? null,
      })
      .eq("id", jobId);
    if (error) throw error;
  }
}
