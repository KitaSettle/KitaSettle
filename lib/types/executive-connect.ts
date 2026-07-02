import type { EntityId, ISO8601 } from "./common";

export type ConnectProvider =
  | "google"
  | "microsoft365"
  | "outlook"
  | "slack"
  | "teams"
  | "dropbox"
  | "onedrive"
  | "notion"
  | "crm"
  | "erp";

export type ConnectService = "calendar" | "gmail" | "drive";

export type IntegrationStatusValue = "connected" | "disconnected" | "error" | "syncing";

export interface IntegrationConnection {
  id: EntityId;
  userId: EntityId;
  provider: ConnectProvider;
  services: ConnectService[];
  status: IntegrationStatusValue;
  accountEmail: string | null;
  scopes: string[];
  lastSyncAt: ISO8601 | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  metadata: Record<string, unknown>;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export type CalendarEventCategory =
  | "meeting"
  | "event"
  | "birthday"
  | "travel"
  | "reminder";

export interface StoredCalendarEvent {
  id: EntityId;
  userId: EntityId;
  provider: ConnectProvider;
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: ISO8601;
  endAt: ISO8601;
  allDay: boolean;
  eventType: string;
  category: CalendarEventCategory;
  attendees: string[];
  sourceCalendar: string | null;
  updatedAt: ISO8601;
}

export interface CalendarSyncState {
  userId: EntityId;
  provider: ConnectProvider;
  syncToken: string | null;
  lastSyncAt: ISO8601 | null;
  lastSyncStatus: string | null;
  eventsSynced: number;
  updatedAt: ISO8601;
}

export type EmailClassification =
  | "urgent"
  | "waiting"
  | "fyi"
  | "approvals"
  | "travel"
  | "finance"
  | "meetings";

export interface StoredEmailMetadata {
  id: EntityId;
  userId: EntityId;
  provider: ConnectProvider;
  externalId: string;
  threadId: string | null;
  subject: string;
  sender: string;
  snippet: string | null;
  body: string | null;
  storeBody: boolean;
  receivedAt: ISO8601;
  classification: EmailClassification;
  labels: string[];
  isImportant: boolean;
  isRead: boolean;
  updatedAt: ISO8601;
}

export interface DocumentFolder {
  id: EntityId;
  userId: EntityId;
  provider: ConnectProvider;
  externalId: string;
  name: string;
  selected: boolean;
  lastIndexedAt: ISO8601 | null;
}

export interface DocumentIndexEntry {
  id: EntityId;
  userId: EntityId;
  provider: ConnectProvider;
  externalId: string;
  folderExternalId: string | null;
  name: string;
  mimeType: string | null;
  modifiedAt: ISO8601 | null;
  webViewLink: string | null;
  sizeBytes: number | null;
  summary: string | null;
  requiresReview: boolean;
  indexedAt: ISO8601;
}

export interface SyncJobRecord {
  id: EntityId;
  userId: EntityId;
  provider: ConnectProvider;
  jobType: "calendar" | "gmail" | "drive" | "full";
  status: "queued" | "running" | "completed" | "failed";
  startedAt: ISO8601 | null;
  completedAt: ISO8601 | null;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: ISO8601;
}

export interface IntegrationStatusSummary {
  provider: ConnectProvider;
  label: string;
  connected: boolean;
  services: ConnectService[];
  accountEmail: string | null;
  lastSyncAt: ISO8601 | null;
  lastSyncStatus: string | null;
}

export interface ExecutiveConnectSnapshot {
  integrations: IntegrationStatusSummary[];
  todayMeetings: StoredCalendarEvent[];
  importantEmails: StoredEmailMetadata[];
  deadlines: StoredCalendarEvent[];
  travel: StoredCalendarEvent[];
  documentsToReview: DocumentIndexEntry[];
  googleConfigured: boolean;
}

export interface UpsertCalendarEventInput {
  externalId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: ISO8601;
  endAt: ISO8601;
  allDay?: boolean;
  eventType?: string;
  category: CalendarEventCategory;
  attendees?: string[];
  sourceCalendar?: string | null;
  rawMetadata?: Record<string, unknown>;
}

export interface UpsertEmailMetadataInput {
  externalId: string;
  threadId?: string | null;
  subject: string;
  sender: string;
  snippet?: string | null;
  body?: string | null;
  storeBody?: boolean;
  receivedAt: ISO8601;
  classification: EmailClassification;
  labels?: string[];
  isImportant?: boolean;
  isRead?: boolean;
  rawMetadata?: Record<string, unknown>;
}

export interface UpsertDocumentIndexInput {
  externalId: string;
  folderExternalId?: string | null;
  name: string;
  mimeType?: string | null;
  modifiedAt?: ISO8601 | null;
  webViewLink?: string | null;
  sizeBytes?: number | null;
  embedding?: number[] | null;
  summary?: string | null;
  requiresReview?: boolean;
}
