export type FutureProvider =
  | "microsoft365"
  | "outlook"
  | "slack"
  | "teams"
  | "dropbox"
  | "onedrive"
  | "notion"
  | "crm"
  | "erp";

export interface FutureProviderAdapter {
  provider: FutureProvider;
  label: string;
  enabled: boolean;
  description: string;
}

export const FUTURE_PROVIDER_ADAPTERS: FutureProviderAdapter[] = [
  { provider: "microsoft365", label: "Microsoft 365", enabled: false, description: "Calendar, mail, and files via Microsoft Graph" },
  { provider: "outlook", label: "Outlook", enabled: false, description: "Outlook mail and calendar intelligence" },
  { provider: "slack", label: "Slack", enabled: false, description: "Team signals and executive notifications" },
  { provider: "teams", label: "Microsoft Teams", enabled: false, description: "Meetings and collaboration context" },
  { provider: "dropbox", label: "Dropbox", enabled: false, description: "Document indexing from Dropbox folders" },
  { provider: "onedrive", label: "OneDrive", enabled: false, description: "Enterprise document indexing" },
  { provider: "notion", label: "Notion", enabled: false, description: "Knowledge and project workspace sync" },
  { provider: "crm", label: "CRM", enabled: false, description: "Pipeline and client intelligence" },
  { provider: "erp", label: "ERP", enabled: false, description: "Operational and delivery signals" },
];
