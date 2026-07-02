import type {
  CalendarSyncState,
  ConnectProvider,
  DocumentFolder,
  DocumentIndexEntry,
  IntegrationConnection,
  IntegrationStatusSummary,
  StoredCalendarEvent,
  StoredEmailMetadata,
  SyncJobRecord,
  UpsertCalendarEventInput,
  UpsertDocumentIndexInput,
  UpsertEmailMetadataInput,
} from "@/lib/types/executive-connect";
import { createId, nowIso } from "@/lib/utils";
import type { IntegrationRepository, IntegrationTokens } from "../integration-repository";
import type { CalendarRepository } from "../calendar-repository";
import type { EmailRepository } from "../email-repository";
import type { DocumentRepository } from "../document-repository";

function clone<T>(value: T): T {
  return structuredClone(value);
}

const MOCK_CALENDAR: UpsertCalendarEventInput[] = [
  {
    externalId: "gcal-meeting-1",
    title: "Board strategy review",
    startAt: new Date(new Date().setUTCHours(10, 0, 0, 0)).toISOString(),
    endAt: new Date(new Date().setUTCHours(11, 0, 0, 0)).toISOString(),
    category: "meeting",
    location: "Executive conference room",
  },
  {
    externalId: "gcal-travel-1",
    title: "Flight to Johannesburg",
    startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    category: "travel",
    location: "JNB",
  },
  {
    externalId: "gcal-birthday-1",
    title: "Team member birthday — Sarah",
    startAt: new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    endAt: new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString(),
    category: "birthday",
    allDay: true,
  },
  {
    externalId: "gcal-reminder-1",
    title: "Proposal submission deadline",
    startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    category: "reminder",
  },
];

const MOCK_EMAILS: UpsertEmailMetadataInput[] = [
  {
    externalId: "gmail-1",
    subject: "Approval required: Steelworks proposal revision",
    sender: "client@steelworks.co.za",
    snippet: "Please review and approve the updated commercial terms.",
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    classification: "approvals",
    isImportant: true,
    isRead: false,
  },
  {
    externalId: "gmail-2",
    subject: "URGENT: Regulatory update affecting aviation training",
    sender: "compliance@aviation.gov",
    snippet: "Immediate action may be required for CBTA compliance.",
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    classification: "urgent",
    isImportant: true,
    isRead: false,
  },
  {
    externalId: "gmail-3",
    subject: "Invoice #8842 — payment due Friday",
    sender: "finance@vendor.com",
    snippet: "Your invoice is attached for processing.",
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    classification: "finance",
    isImportant: true,
  },
  {
    externalId: "gmail-4",
    subject: "Meeting invite: Client review call",
    sender: "calendar-notification@google.com",
    snippet: "You have been invited to a meeting tomorrow at 14:00.",
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    classification: "meetings",
  },
];

const MOCK_DOCUMENTS: UpsertDocumentIndexInput[] = [
  {
    externalId: "gdrive-doc-1",
    folderExternalId: "folder-proposals",
    name: "Steelworks Proposal v3.docx",
    mimeType: "application/vnd.google-apps.document",
    modifiedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    requiresReview: true,
    summary: "Updated commercial proposal awaiting executive review.",
  },
  {
    externalId: "gdrive-doc-2",
    folderExternalId: "folder-board",
    name: "Q3 Board Pack.pdf",
    mimeType: "application/pdf",
    modifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    requiresReview: true,
    summary: "Board materials with financial appendix.",
  },
];

const MOCK_FOLDERS: Omit<DocumentFolder, "id" | "userId" | "provider">[] = [
  { externalId: "folder-proposals", name: "Proposals", selected: true, lastIndexedAt: nowIso() },
  { externalId: "folder-board", name: "Board Materials", selected: true, lastIndexedAt: nowIso() },
  { externalId: "folder-legal", name: "Legal", selected: false, lastIndexedAt: null },
];

function toStoredCalendar(userId: string, event: UpsertCalendarEventInput): StoredCalendarEvent {
  return {
    id: createId("cal"),
    userId,
    provider: "google",
    externalId: event.externalId,
    title: event.title,
    description: event.description ?? null,
    location: event.location ?? null,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay ?? false,
    eventType: event.eventType ?? "event",
    category: event.category,
    attendees: event.attendees ?? [],
    sourceCalendar: event.sourceCalendar ?? null,
    updatedAt: nowIso(),
  };
}

function toStoredEmail(userId: string, message: UpsertEmailMetadataInput): StoredEmailMetadata {
  return {
    id: createId("email"),
    userId,
    provider: "google",
    externalId: message.externalId,
    threadId: message.threadId ?? null,
    subject: message.subject,
    sender: message.sender,
    snippet: message.snippet ?? null,
    body: message.storeBody ? message.body ?? null : null,
    storeBody: message.storeBody ?? false,
    receivedAt: message.receivedAt,
    classification: message.classification,
    labels: message.labels ?? [],
    isImportant: message.isImportant ?? false,
    isRead: message.isRead ?? true,
    updatedAt: nowIso(),
  };
}

function toStoredDocument(userId: string, doc: UpsertDocumentIndexInput): DocumentIndexEntry {
  return {
    id: createId("doc"),
    userId,
    provider: "google",
    externalId: doc.externalId,
    folderExternalId: doc.folderExternalId ?? null,
    name: doc.name,
    mimeType: doc.mimeType ?? null,
    modifiedAt: doc.modifiedAt ?? null,
    webViewLink: doc.webViewLink ?? null,
    sizeBytes: doc.sizeBytes ?? null,
    summary: doc.summary ?? null,
    requiresReview: doc.requiresReview ?? false,
    indexedAt: nowIso(),
  };
}

export class MockIntegrationRepository implements IntegrationRepository {
  private connections = new Map<string, IntegrationConnection>();
  private tokens = new Map<string, IntegrationTokens>();
  private jobs: SyncJobRecord[] = [];

  private key(userId: string, provider: ConnectProvider): string {
    return `${userId}:${provider}`;
  }

  async getConnection(userId: string, provider: ConnectProvider): Promise<IntegrationConnection | null> {
    return clone(this.connections.get(this.key(userId, provider)) ?? null);
  }

  async listConnections(userId: string): Promise<IntegrationConnection[]> {
    return clone([...this.connections.values()].filter((item) => item.userId === userId));
  }

  async upsertConnection(
    userId: string,
    provider: ConnectProvider,
    patch: Partial<IntegrationConnection>,
  ): Promise<IntegrationConnection> {
    const existing = this.connections.get(this.key(userId, provider));
    const updated: IntegrationConnection = {
      id: existing?.id ?? createId("conn"),
      userId,
      provider,
      services: patch.services ?? existing?.services ?? ["calendar", "gmail", "drive"],
      status: patch.status ?? existing?.status ?? "connected",
      accountEmail: patch.accountEmail ?? existing?.accountEmail ?? "executive@kitasettle.com",
      scopes: patch.scopes ?? existing?.scopes ?? [],
      lastSyncAt: patch.lastSyncAt ?? existing?.lastSyncAt ?? null,
      lastSyncStatus: patch.lastSyncStatus ?? existing?.lastSyncStatus ?? null,
      lastSyncError: patch.lastSyncError ?? existing?.lastSyncError ?? null,
      metadata: patch.metadata ?? existing?.metadata ?? {},
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };
    this.connections.set(this.key(userId, provider), updated);
    return clone(updated);
  }

  async saveTokens(userId: string, provider: ConnectProvider, tokens: IntegrationTokens): Promise<void> {
    this.tokens.set(this.key(userId, provider), tokens);
    await this.upsertConnection(userId, provider, {
      status: "connected",
      accountEmail: tokens.accountEmail,
      scopes: tokens.scopes,
    });
  }

  async getTokens(userId: string, provider: ConnectProvider): Promise<IntegrationTokens | null> {
    return clone(this.tokens.get(this.key(userId, provider)) ?? null);
  }

  async disconnect(userId: string, provider: ConnectProvider): Promise<void> {
    this.tokens.delete(this.key(userId, provider));
    await this.upsertConnection(userId, provider, { status: "disconnected" });
  }

  async updateSyncStatus(userId: string, provider: ConnectProvider, status: string, error?: string | null): Promise<void> {
    await this.upsertConnection(userId, provider, {
      lastSyncAt: nowIso(),
      lastSyncStatus: status,
      lastSyncError: error ?? null,
    });
  }

  async createSyncJob(
    userId: string,
    provider: ConnectProvider,
    jobType: SyncJobRecord["jobType"],
    metadata: Record<string, unknown> = {},
  ): Promise<SyncJobRecord> {
    const job: SyncJobRecord = {
      id: createId("job"),
      userId,
      provider,
      jobType,
      status: "running",
      startedAt: nowIso(),
      completedAt: null,
      error: null,
      metadata,
      createdAt: nowIso(),
    };
    this.jobs.unshift(job);
    return clone(job);
  }

  async completeSyncJob(jobId: string, status: "completed" | "failed", error?: string | null): Promise<void> {
    const job = this.jobs.find((item) => item.id === jobId);
    if (job) {
      job.status = status;
      job.completedAt = nowIso();
      job.error = error ?? null;
    }
  }
}

export class MockCalendarRepository implements CalendarRepository {
  private events = new Map<string, StoredCalendarEvent[]>();

  private ensure(userId: string): StoredCalendarEvent[] {
    if (!this.events.has(userId)) {
      this.events.set(userId, MOCK_CALENDAR.map((event) => toStoredCalendar(userId, event)));
    }
    return this.events.get(userId)!;
  }

  async upsertEvents(userId: string, provider: ConnectProvider, events: UpsertCalendarEventInput[]): Promise<number> {
    const current = this.ensure(userId);
    for (const event of events) {
      const index = current.findIndex((item) => item.externalId === event.externalId && item.provider === provider);
      const stored = { ...toStoredCalendar(userId, event), provider };
      if (index >= 0) current[index] = stored;
      else current.push(stored);
    }
    return events.length;
  }

  async listToday(userId: string): Promise<StoredCalendarEvent[]> {
    const today = new Date();
    return clone(
      this.ensure(userId).filter((event) => {
        const start = new Date(event.startAt);
        return (
          start.getUTCFullYear() === today.getUTCFullYear() &&
          start.getUTCMonth() === today.getUTCMonth() &&
          start.getUTCDate() === today.getUTCDate()
        );
      }),
    );
  }

  async listUpcoming(userId: string, days = 7): Promise<StoredCalendarEvent[]> {
    const end = Date.now() + days * 24 * 60 * 60 * 1000;
    return clone(this.ensure(userId).filter((event) => new Date(event.startAt).getTime() <= end));
  }

  async listByCategory(userId: string, category: StoredCalendarEvent["category"]): Promise<StoredCalendarEvent[]> {
    return clone(this.ensure(userId).filter((event) => event.category === category));
  }

  async listDeadlines(userId: string): Promise<StoredCalendarEvent[]> {
    return clone(this.ensure(userId).filter((event) => event.category === "reminder"));
  }

  async getSyncState(userId: string, provider: ConnectProvider): Promise<CalendarSyncState | null> {
    return {
      userId,
      provider,
      syncToken: null,
      lastSyncAt: nowIso(),
      lastSyncStatus: "completed",
      eventsSynced: this.ensure(userId).length,
      updatedAt: nowIso(),
    };
  }

  async saveSyncState(userId: string, provider: ConnectProvider, patch: Partial<CalendarSyncState>): Promise<CalendarSyncState> {
    return {
      userId,
      provider,
      syncToken: patch.syncToken ?? null,
      lastSyncAt: patch.lastSyncAt ?? nowIso(),
      lastSyncStatus: patch.lastSyncStatus ?? "completed",
      eventsSynced: patch.eventsSynced ?? this.ensure(userId).length,
      updatedAt: nowIso(),
    };
  }
}

export class MockEmailRepository implements EmailRepository {
  private messages = new Map<string, StoredEmailMetadata[]>();

  private ensure(userId: string): StoredEmailMetadata[] {
    if (!this.messages.has(userId)) {
      this.messages.set(userId, MOCK_EMAILS.map((message) => toStoredEmail(userId, message)));
    }
    return this.messages.get(userId)!;
  }

  async upsertMessages(userId: string, provider: ConnectProvider, messages: UpsertEmailMetadataInput[]): Promise<number> {
    const current = this.ensure(userId);
    for (const message of messages) {
      const index = current.findIndex((item) => item.externalId === message.externalId);
      const stored = { ...toStoredEmail(userId, message), provider };
      if (index >= 0) current[index] = stored;
      else current.push(stored);
    }
    return messages.length;
  }

  async listImportant(userId: string, limit = 10): Promise<StoredEmailMetadata[]> {
    return clone(
      this.ensure(userId)
        .filter((item) => item.isImportant || ["urgent", "approvals", "finance", "meetings"].includes(item.classification))
        .slice(0, limit),
    );
  }

  async listByClassification(userId: string, classification: StoredEmailMetadata["classification"], limit = 20): Promise<StoredEmailMetadata[]> {
    return clone(this.ensure(userId).filter((item) => item.classification === classification).slice(0, limit));
  }

  async listRecent(userId: string, limit = 20): Promise<StoredEmailMetadata[]> {
    return clone(this.ensure(userId).slice(0, limit));
  }

  async saveBody(userId: string, externalId: string, body: string): Promise<void> {
    const message = this.ensure(userId).find((item) => item.externalId === externalId);
    if (message) {
      message.body = body;
      message.storeBody = true;
    }
  }
}

export class MockDocumentRepository implements DocumentRepository {
  private documents = new Map<string, DocumentIndexEntry[]>();
  private folders = new Map<string, DocumentFolder[]>();

  private ensureDocs(userId: string): DocumentIndexEntry[] {
    if (!this.documents.has(userId)) {
      this.documents.set(userId, MOCK_DOCUMENTS.map((doc) => toStoredDocument(userId, doc)));
    }
    return this.documents.get(userId)!;
  }

  private ensureFolders(userId: string): DocumentFolder[] {
    if (!this.folders.has(userId)) {
      this.folders.set(
        userId,
        MOCK_FOLDERS.map((folder) => ({
          ...folder,
          id: createId("folder"),
          userId,
          provider: "google" as const,
        })),
      );
    }
    return this.folders.get(userId)!;
  }

  async upsertDocuments(userId: string, provider: ConnectProvider, documents: UpsertDocumentIndexInput[]): Promise<number> {
    const current = this.ensureDocs(userId);
    for (const doc of documents) {
      const index = current.findIndex((item) => item.externalId === doc.externalId);
      const stored = { ...toStoredDocument(userId, doc), provider };
      if (index >= 0) current[index] = stored;
      else current.push(stored);
    }
    return documents.length;
  }

  async listFolders(userId: string): Promise<DocumentFolder[]> {
    return clone(this.ensureFolders(userId));
  }

  async saveFolders(userId: string, provider: ConnectProvider, folders: Omit<DocumentFolder, "id" | "userId" | "provider">[]): Promise<DocumentFolder[]> {
    const saved = folders.map((folder) => ({
      ...folder,
      id: createId("folder"),
      userId,
      provider,
    }));
    this.folders.set(userId, saved);
    return clone(saved);
  }

  async setSelectedFolders(userId: string, _provider: ConnectProvider, externalIds: string[]): Promise<void> {
    const current = this.ensureFolders(userId);
    for (const folder of current) {
      folder.selected = externalIds.includes(folder.externalId);
    }
  }

  async listSelectedFolders(userId: string): Promise<DocumentFolder[]> {
    return clone(this.ensureFolders(userId).filter((folder) => folder.selected));
  }

  async listRequiringReview(userId: string, limit = 10): Promise<DocumentIndexEntry[]> {
    return clone(this.ensureDocs(userId).filter((doc) => doc.requiresReview).slice(0, limit));
  }

  async listRecent(userId: string, limit = 10): Promise<DocumentIndexEntry[]> {
    return clone(this.ensureDocs(userId).slice(0, limit));
  }

  async getByExternalId(userId: string, externalId: string): Promise<DocumentIndexEntry | null> {
    return clone(this.ensureDocs(userId).find((doc) => doc.externalId === externalId) ?? null);
  }
}

export function buildMockIntegrationSummary(userId: string): IntegrationStatusSummary[] {
  return [
    {
      provider: "google",
      label: "Google Workspace",
      connected: true,
      services: ["calendar", "gmail", "drive"],
      accountEmail: "executive@kitasettle.com",
      lastSyncAt: nowIso(),
      lastSyncStatus: "completed",
    },
  ];
}

// Seed mock google connection on first access
export function seedMockGoogleConnection(userId: string, integrations: MockIntegrationRepository): void {
  void integrations.upsertConnection(userId, "google", {
    status: "connected",
    services: ["calendar", "gmail", "drive"],
    accountEmail: "executive@kitasettle.com",
    lastSyncAt: nowIso(),
    lastSyncStatus: "completed",
  });
}
