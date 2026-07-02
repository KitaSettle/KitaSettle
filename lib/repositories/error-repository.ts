import type { SupabaseClient } from "@supabase/supabase-js";
import type { ErrorRecordInput } from "@/lib/types/mission-control";
import { createId } from "@/lib/utils";
import { secureLogger } from "@/lib/security/logger";

export interface ErrorRepository {
  record(input: ErrorRecordInput): Promise<void>;
}

export class SupabaseErrorRepository implements ErrorRepository {
  constructor(private client: SupabaseClient) {}

  async record(input: ErrorRecordInput): Promise<void> {
    const { error } = await this.client.from("error_events").insert({
      id: createId("error"),
      user_id: input.userId ?? null,
      source: input.source,
      message: input.message.slice(0, 2000),
      stack_trace: input.stackTrace?.slice(0, 4000) ?? null,
      metadata: input.metadata ?? {},
      retryable: input.retryable ?? false,
    });

    if (error) {
      secureLogger.warn("error_event_write_failed", { source: input.source });
    }
  }
}

export class MockErrorRepository implements ErrorRepository {
  async record(input: ErrorRecordInput): Promise<void> {
    secureLogger.warn("error_event", { source: input.source, message: input.message.slice(0, 120) });
  }
}
