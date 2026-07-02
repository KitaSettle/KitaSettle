import { DATA_RETENTION_RULES } from "./types";

export function getRetentionDays(resource: string): number | null {
  return DATA_RETENTION_RULES.find((rule) => rule.resource === resource)?.retentionDays ?? null;
}

export function describeRetentionPolicies(): typeof DATA_RETENTION_RULES {
  return DATA_RETENTION_RULES;
}

export async function purgeExpiredAuditLogs(
  client: { from: (table: string) => { delete: () => { lt: (column: string, value: string) => Promise<{ error: unknown }> } } },
): Promise<void> {
  const days = getRetentionDays("audit_logs");
  if (!days) return;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  await client.from("audit_logs").delete().lt("created_at", cutoff);
}
