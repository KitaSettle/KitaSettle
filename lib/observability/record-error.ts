import { isSupabaseConfigured } from "@/lib/config/env";
import { SupabaseErrorRepository } from "@/lib/repositories/error-repository";
import { createScriptClient } from "@/lib/supabase/script";
import { secureLogger } from "@/lib/security/logger";

export async function recordOperationalError(input: {
  source: string;
  message: string;
  userId?: string | null;
  retryable?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  secureLogger.warn(input.source, { message: input.message.slice(0, 200) });

  if (!isSupabaseConfigured()) return;

  try {
    const repo = new SupabaseErrorRepository(createScriptClient());
    await repo.record({
      source: input.source,
      message: input.message,
      userId: input.userId ?? null,
      retryable: input.retryable ?? false,
      metadata: input.metadata,
    });
  } catch {
    secureLogger.warn("error_event_record_failed", { source: input.source });
  }
}
