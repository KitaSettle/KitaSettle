import type { Repositories } from "@/lib/repositories";
import type { ConnectProvider, IntegrationStatusSummary } from "@/lib/types/executive-connect";
import { CalendarService } from "./calendar-service";
import { DocumentService } from "./document-service";
import { EmailService } from "./email-service";
import { GoogleProvider } from "./google-provider";
import { SyncScheduler } from "./sync-scheduler";

export class IntegrationManager {
  private googleProvider: GoogleProvider;
  private syncScheduler: SyncScheduler;
  private calendarService: CalendarService;
  private emailService: EmailService;
  private documentService: DocumentService;

  constructor(private repos: Repositories) {
    this.googleProvider = new GoogleProvider(repos);
    this.syncScheduler = new SyncScheduler(repos);
    this.calendarService = new CalendarService(repos);
    this.emailService = new EmailService(repos);
    this.documentService = new DocumentService(repos);
  }

  get google(): GoogleProvider {
    return this.googleProvider;
  }

  get calendar(): CalendarService {
    return this.calendarService;
  }

  get email(): EmailService {
    return this.emailService;
  }

  get documents(): DocumentService {
    return this.documentService;
  }

  get scheduler(): SyncScheduler {
    return this.syncScheduler;
  }

  async listStatus(userId: string): Promise<IntegrationStatusSummary[]> {
    const connections = await this.repos.integrations.listConnections(userId);
    const providers: ConnectProvider[] = [
      "google",
      "microsoft365",
      "outlook",
      "slack",
      "teams",
      "dropbox",
      "onedrive",
      "notion",
      "crm",
      "erp",
    ];

    const labels: Record<ConnectProvider, string> = {
      google: "Google Workspace",
      microsoft365: "Microsoft 365",
      outlook: "Outlook",
      slack: "Slack",
      teams: "Microsoft Teams",
      dropbox: "Dropbox",
      onedrive: "OneDrive",
      notion: "Notion",
      crm: "CRM",
      erp: "ERP",
    };

    return providers.map((provider) => {
      const connection = connections.find((item) => item.provider === provider);
      return {
        provider,
        label: labels[provider],
        connected: connection?.status === "connected",
        services: connection?.services ?? [],
        accountEmail: connection?.accountEmail ?? null,
        lastSyncAt: connection?.lastSyncAt ?? null,
        lastSyncStatus: connection?.lastSyncStatus ?? null,
      };
    });
  }
}

export function createIntegrationManager(repos: Repositories): IntegrationManager {
  return new IntegrationManager(repos);
}

export { SyncScheduler } from "./sync-scheduler";
