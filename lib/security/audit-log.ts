import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogInput } from "./types";
import { secureLogger } from "./logger";

export interface AuditRepository {
  write(entry: AuditLogInput): Promise<void>;
}

export class SupabaseAuditRepository implements AuditRepository {
  constructor(private client: SupabaseClient) {}

  async write(entry: AuditLogInput): Promise<void> {
    const { error } = await this.client.from("audit_logs").insert({
      user_id: entry.userId ?? null,
      event_type: entry.eventType,
      resource: entry.resource,
      action: entry.action,
      metadata: entry.metadata ?? {},
      ip_address: entry.ipAddress ?? null,
    });

    if (error) {
      secureLogger.warn("audit_log_write_failed", {
        eventType: entry.eventType,
        resource: entry.resource,
        action: entry.action,
      });
    }
  }
}

class MemoryAuditRepository implements AuditRepository {
  private entries: AuditLogInput[] = [];

  async write(entry: AuditLogInput): Promise<void> {
    this.entries.unshift(entry);
    secureLogger.info("audit_event", {
      eventType: entry.eventType,
      resource: entry.resource,
      action: entry.action,
      userId: entry.userId ?? "anonymous",
    });
  }
}

let memoryAuditRepository: MemoryAuditRepository | null = null;

export function createAuditRepository(client?: SupabaseClient): AuditRepository {
  if (client) return new SupabaseAuditRepository(client);
  if (!memoryAuditRepository) memoryAuditRepository = new MemoryAuditRepository();
  return memoryAuditRepository;
}

export async function recordAuditEvent(
  repository: AuditRepository,
  entry: AuditLogInput,
): Promise<void> {
  await repository.write(entry);
}
