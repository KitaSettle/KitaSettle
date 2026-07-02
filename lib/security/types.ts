export type AuditEventType =
  | "login"
  | "data_access"
  | "integration_connect"
  | "integration_disconnect"
  | "ai_generation"
  | "approval"
  | "rejection"
  | "deletion"
  | "rate_limited";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  eventType: AuditEventType;
  resource: string;
  action: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogInput {
  userId?: string | null;
  eventType: AuditEventType;
  resource: string;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export interface DataRetentionRule {
  resource: string;
  retentionDays: number;
  description: string;
}

export const DATA_RETENTION_RULES: DataRetentionRule[] = [
  { resource: "audit_logs", retentionDays: 90, description: "Security audit logs retained for 90 days." },
  { resource: "email_metadata", retentionDays: 30, description: "Email metadata retained for 30 days unless body stored." },
  { resource: "email_metadata_body", retentionDays: 7, description: "Opt-in email bodies retained for 7 days." },
  { resource: "sync_jobs", retentionDays: 30, description: "Integration sync job records retained for 30 days." },
  { resource: "decision_learning_events", retentionDays: 365, description: "Decision learning events retained for 1 year." },
  { resource: "executive_dna_learning_events", retentionDays: 365, description: "DNA learning events retained for 1 year." },
];
