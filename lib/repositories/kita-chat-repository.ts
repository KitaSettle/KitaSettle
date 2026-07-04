import type { SupabaseClient } from "@supabase/supabase-js";

export interface KitaChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface KitaChatRepository {
  listMessages(userId: string, limit?: number): Promise<KitaChatMessage[]>;
  appendMessage(
    userId: string,
    message: Pick<KitaChatMessage, "role" | "content">,
  ): Promise<KitaChatMessage>;
}

export class SupabaseKitaChatRepository implements KitaChatRepository {
  constructor(private client: SupabaseClient) {}

  async listMessages(userId: string, limit = 100): Promise<KitaChatMessage[]> {
    const { data, error } = await this.client
      .from("kita_chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId,
      role: row.role as KitaChatMessage["role"],
      content: row.content as string,
      createdAt: row.created_at as string,
    }));
  }

  async appendMessage(
    userId: string,
    message: Pick<KitaChatMessage, "role" | "content">,
  ): Promise<KitaChatMessage> {
    const { data, error } = await this.client
      .from("kita_chat_messages")
      .insert({
        user_id: userId,
        role: message.role,
        content: message.content,
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      id: data.id as string,
      userId,
      role: data.role as KitaChatMessage["role"],
      content: data.content as string,
      createdAt: data.created_at as string,
    };
  }
}

export class MockKitaChatRepository implements KitaChatRepository {
  private store = new Map<string, KitaChatMessage[]>();

  async listMessages(userId: string, limit = 100): Promise<KitaChatMessage[]> {
    return (this.store.get(userId) ?? []).slice(-limit);
  }

  async appendMessage(
    userId: string,
    message: Pick<KitaChatMessage, "role" | "content">,
  ): Promise<KitaChatMessage> {
    const saved: KitaChatMessage = {
      id: `chat-${Date.now()}`,
      userId,
      role: message.role,
      content: message.content,
      createdAt: new Date().toISOString(),
    };
    const existing = this.store.get(userId) ?? [];
    this.store.set(userId, [...existing, saved]);
    return saved;
  }
}
