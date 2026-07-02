export type IntegrationProvider =
  | "google_calendar"
  | "gmail"
  | "whatsapp"
  | "slack"
  | "teams"
  | "notion"
  | "crm"
  | "erp"
  | "finance";

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  enabled: boolean;
  description: string;
}

export const FUTURE_INTEGRATIONS: IntegrationAdapter[] = [
  { provider: "google_calendar", enabled: false, description: "Calendar-aware brief timing and meeting prep" },
  { provider: "gmail", enabled: false, description: "Email signal for priorities and follow-ups" },
  { provider: "whatsapp", enabled: false, description: "Executive notifications and quick approvals" },
  { provider: "slack", enabled: false, description: "Team signal ingestion for leadership context" },
  { provider: "teams", enabled: false, description: "Meeting and collaboration intelligence" },
  { provider: "notion", enabled: false, description: "Knowledge and project context sync" },
  { provider: "crm", enabled: false, description: "Pipeline and client intelligence" },
  { provider: "erp", enabled: false, description: "Operational and delivery signals" },
  { provider: "finance", enabled: false, description: "Cash flow and budget-aware recommendations" },
];
