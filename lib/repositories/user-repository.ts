import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbBrainActivity, DbUser } from "@/lib/database/types";
import type { User } from "@/lib/types/ui";
import type { BrainActivityItem } from "@/lib/types/ui";

export interface UserRepository {
  getProfile(userId: string): Promise<User | null>;
  upsertProfile(userId: string, profile: User): Promise<User>;
}

export interface BrainActivityRepository {
  list(userId: string, limit?: number): Promise<BrainActivityItem[]>;
  add(userId: string, action: string, target: string): Promise<BrainActivityItem>;
}

export function mapUserRow(row: DbUser): User {
  return {
    name: row.name,
    email: row.email,
  };
}

function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function mapActivityRow(row: DbBrainActivity): BrainActivityItem {
  return {
    id: row.id,
    action: row.action,
    target: row.target,
    timestamp: formatActivityTimestamp(row.created_at),
  };
}

export class SupabaseUserRepository implements UserRepository {
  constructor(private client: SupabaseClient) {}

  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapUserRow(data as DbUser) : null;
  }

  async upsertProfile(userId: string, profile: User): Promise<User> {
    const { data, error } = await this.client
      .from("users")
      .upsert({
        id: userId,
        name: profile.name,
        email: profile.email,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapUserRow(data as DbUser);
  }
}

export class SupabaseBrainActivityRepository implements BrainActivityRepository {
  constructor(private client: SupabaseClient) {}

  async list(userId: string, limit = 20): Promise<BrainActivityItem[]> {
    const { data, error } = await this.client
      .from("brain_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as DbBrainActivity[]).map(mapActivityRow);
  }

  async add(userId: string, action: string, target: string): Promise<BrainActivityItem> {
    const { data, error } = await this.client
      .from("brain_activity")
      .insert({ user_id: userId, action, target })
      .select("*")
      .single();

    if (error) throw error;
    return mapActivityRow(data as DbBrainActivity);
  }
}
