import type { SupabaseClient } from "@supabase/supabase-js";
import { nowIso } from "@/lib/utils";

export interface BetaAdminRepository {
  inviteUser(email: string, profession?: string, notes?: string, invitedBy?: string): Promise<void>;
  disableUser(userId: string, disabled: boolean): Promise<void>;
  setDailyBudget(userId: string, budgetUsd: number): Promise<void>;
  updateBetaNotes(userId: string, notes: string): Promise<void>;
  setDefaultDailyBudget(budgetUsd: number): Promise<void>;
}

export class SupabaseBetaAdminRepository implements BetaAdminRepository {
  constructor(private client: SupabaseClient) {}

  async inviteUser(email: string, profession?: string, notes?: string, invitedBy?: string): Promise<void> {
    const { error } = await this.client.from("beta_invites").insert({
      email: email.toLowerCase(),
      profession: profession ?? null,
      notes: notes ?? null,
      invited_by: invitedBy ?? null,
      status: "pending",
    });
    if (error) throw error;
  }

  async disableUser(userId: string, disabled: boolean): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({ is_disabled: disabled, updated_at: nowIso() })
      .eq("id", userId);
    if (error) throw error;
  }

  async setDailyBudget(userId: string, budgetUsd: number): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({ daily_ai_budget_usd: budgetUsd, updated_at: nowIso() })
      .eq("id", userId);
    if (error) throw error;
  }

  async updateBetaNotes(userId: string, notes: string): Promise<void> {
    const { error } = await this.client
      .from("users")
      .update({ beta_notes: notes, updated_at: nowIso() })
      .eq("id", userId);
    if (error) throw error;
  }

  async setDefaultDailyBudget(budgetUsd: number): Promise<void> {
    const { error } = await this.client.from("platform_settings").upsert({
      key: "default_daily_ai_budget_usd",
      value: budgetUsd,
      updated_at: nowIso(),
    });
    if (error) throw error;
  }
}

export class MockBetaAdminRepository implements BetaAdminRepository {
  async inviteUser(): Promise<void> {}
  async disableUser(): Promise<void> {}
  async setDailyBudget(): Promise<void> {}
  async updateBetaNotes(): Promise<void> {}
  async setDefaultDailyBudget(): Promise<void> {}
}
