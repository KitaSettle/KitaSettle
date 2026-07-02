import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackRecordInput } from "@/lib/types/mission-control";
import { createId, nowIso } from "@/lib/utils";

export interface FeedbackRepository {
  create(input: FeedbackRecordInput): Promise<{ id: string }>;
}

export class SupabaseFeedbackRepository implements FeedbackRepository {
  constructor(private client: SupabaseClient) {}

  async create(input: FeedbackRecordInput): Promise<{ id: string }> {
    const id = createId("feedback");
    const { error } = await this.client.from("user_feedback").insert({
      id,
      user_id: input.userId ?? null,
      feedback_type: input.type,
      rating: input.rating ?? null,
      message: input.message,
      metadata: input.metadata ?? {},
    });
    if (error) throw error;
    return { id };
  }
}

export class MockFeedbackRepository implements FeedbackRepository {
  async create(_input: FeedbackRecordInput): Promise<{ id: string }> {
    return { id: createId("feedback") };
  }
}
