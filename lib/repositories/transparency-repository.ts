import type { SupabaseClient } from "@supabase/supabase-js";
import type { Repositories } from "@/lib/repositories";
import type { ExecutiveDNALearningEvent } from "@/lib/types/executive-dna";
import type { IntegrationStatusSummary } from "@/lib/types/executive-connect";
import { createIntegrationManager } from "@/lib/integrations";
import { withConnectFallback, EMPTY_CONNECT_SNAPSHOT } from "@/lib/integrations/defaults";

export interface UserMeta {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface TransparencyCounts {
  documentsLearned: number;
  meetingsUnderstood: number;
  projects: number;
  decisions: number;
  knowledgeItems: number;
  memoryItems: number;
}

export interface TransparencyRepository {
  getUserMeta(userId: string): Promise<UserMeta>;
  getCounts(userId: string): Promise<TransparencyCounts>;
  getIntegrations(userId: string): Promise<IntegrationStatusSummary[]>;
  getLearningHistory(userId: string, limit?: number): Promise<ExecutiveDNALearningEvent[]>;
  deleteAllKnowledge(userId: string): Promise<number>;
  deleteAllMemory(userId: string): Promise<number>;
  deleteAllDocuments(userId: string): Promise<number>;
  deleteAccount(userId: string): Promise<void>;
}

export class SupabaseTransparencyRepository implements TransparencyRepository {
  constructor(
    private repos: Repositories,
    private client: SupabaseClient,
    private adminClient?: SupabaseClient,
  ) {}

  async getUserMeta(userId: string): Promise<UserMeta> {
    const profile = await this.repos.users.getProfile(userId);
    const { data, error } = await this.client
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    return {
      userId,
      name: profile?.name ?? "Executive",
      email: profile?.email ?? "",
      createdAt: (data?.created_at as string | undefined) ?? new Date().toISOString(),
    };
  }

  async getCounts(userId: string): Promise<TransparencyCounts> {
    const [profile, intake, knowledge, memory, decisions, meetings] = await Promise.all([
      this.repos.executiveDna.ensureProfile(userId),
      this.repos.intake.list(userId, 500),
      this.repos.knowledge.getAll(userId),
      this.repos.memory.getAll(userId),
      this.repos.decisions.listPending(userId),
      this.client
        .from("calendar_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const { count: decisionTotal } = await this.client
      .from("decision_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      documentsLearned: intake.length,
      meetingsUnderstood: meetings.count ?? 0,
      projects: profile.profile.currentProjects.length,
      decisions: decisionTotal ?? decisions.length,
      knowledgeItems: knowledge.length,
      memoryItems: memory.filter((item) => item.status !== "archived").length,
    };
  }

  async getIntegrations(userId: string): Promise<IntegrationStatusSummary[]> {
    const manager = createIntegrationManager(this.repos);
    return withConnectFallback(
      () => manager.listStatus(userId),
      EMPTY_CONNECT_SNAPSHOT.integrations,
    );
  }

  async getLearningHistory(userId: string, limit = 50): Promise<ExecutiveDNALearningEvent[]> {
    return this.repos.executiveDna.getLearningHistory(userId, limit);
  }

  async deleteAllKnowledge(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("knowledge")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (error) throw error;
    return count ?? 0;
  }

  async deleteAllMemory(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("executive_memory")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (error) throw error;
    return count ?? 0;
  }

  async deleteAllDocuments(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("intake_items")
      .delete({ count: "exact" })
      .eq("user_id", userId);

    if (error) throw error;
    return count ?? 0;
  }

  async deleteAccount(userId: string): Promise<void> {
    if (!this.adminClient) {
      throw new Error("Account deletion is not configured.");
    }

    const { error: authError } = await this.adminClient.auth.admin.deleteUser(userId);
    if (authError) throw authError;
  }
}

export class MockTransparencyRepository implements TransparencyRepository {
  constructor(private repos: Repositories) {}

  async getUserMeta(userId: string): Promise<UserMeta> {
    const profile = await this.repos.users.getProfile(userId);
    return {
      userId,
      name: profile?.name ?? "Executive",
      email: profile?.email ?? "executive@example.com",
      createdAt: new Date(Date.now() - 17 * 86400000).toISOString(),
    };
  }

  async getCounts(userId: string): Promise<TransparencyCounts> {
    const profile = await this.repos.executiveDna.ensureProfile(userId);
    const intake = await this.repos.intake.list(userId);
    const knowledge = await this.repos.knowledge.getAll(userId);
    const memory = await this.repos.memory.getAll(userId);
    const decisions = await this.repos.decisions.listPending(userId);

    return {
      documentsLearned: intake.length,
      meetingsUnderstood: 12,
      projects: profile.profile.currentProjects.length || 3,
      decisions: decisions.length || 8,
      knowledgeItems: knowledge.length,
      memoryItems: memory.length,
    };
  }

  async getIntegrations(userId: string): Promise<IntegrationStatusSummary[]> {
    return EMPTY_CONNECT_SNAPSHOT.integrations;
  }

  async getLearningHistory(userId: string, limit = 50): Promise<ExecutiveDNALearningEvent[]> {
    return this.repos.executiveDna.getLearningHistory(userId, limit);
  }

  async deleteAllKnowledge(userId: string): Promise<number> {
    const items = await this.repos.knowledge.getAll(userId);
    await Promise.all(items.map((item) => this.repos.knowledge.delete(userId, item.id)));
    return items.length;
  }

  async deleteAllMemory(userId: string): Promise<number> {
    const items = await this.repos.memory.getAll(userId);
    for (const item of items) {
      await this.repos.memory.archive(userId, item.id);
    }
    return items.length;
  }

  async deleteAllDocuments(userId: string): Promise<number> {
    const items = await this.repos.intake.list(userId);
    return items.length;
  }

  async deleteAccount(_userId: string): Promise<void> {
    throw new Error("Account deletion is disabled in mock mode.");
  }
}
