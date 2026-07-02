import { env, isGoogleOAuthConfigured } from "@/lib/config/env";

export { isGoogleOAuthConfigured };

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getGoogleRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${env.appUrl}/api/integrations/google/callback`;
}

export function getGoogleOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { email?: string };
  return data.email ?? null;
}

async function googleFetch<T>(accessToken: string, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Google API request failed (${response.status}): ${url}`);
  }
  return (await response.json()) as T;
}

export interface GoogleCalendarListResponse {
  items?: Array<{
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    description?: string;
    location?: string;
    eventType?: string;
    attendees?: Array<{ email?: string }>;
  }>;
  nextSyncToken?: string;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<GoogleCalendarListResponse> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  return googleFetch(accessToken, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`);
}

export interface GoogleGmailListResponse {
  messages?: Array<{ id: string; threadId?: string }>;
}

export interface GoogleGmailMessageResponse {
  id: string;
  threadId?: string;
  snippet?: string;
  labelIds?: string[];
  internalDate?: string;
  payload?: {
    headers?: Array<{ name?: string; value?: string }>;
  };
}

export async function fetchGoogleGmailMessages(accessToken: string, maxResults = 30): Promise<GoogleGmailListResponse> {
  const params = new URLSearchParams({ maxResults: String(maxResults), q: "newer_than:14d" });
  return googleFetch(accessToken, `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`);
}

export async function fetchGoogleGmailMessage(
  accessToken: string,
  messageId: string,
): Promise<GoogleGmailMessageResponse> {
  const params = new URLSearchParams({
    format: "metadata",
  });
  params.append("metadataHeaders", "Subject");
  params.append("metadataHeaders", "From");
  return googleFetch(
    accessToken,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?${params}`,
  );
}

export interface GoogleDriveFile {
  id: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  webViewLink?: string;
  size?: string;
  parents?: string[];
}

export interface GoogleDriveListResponse {
  files?: GoogleDriveFile[];
  nextPageToken?: string;
}

export async function fetchGoogleDriveFolders(accessToken: string): Promise<GoogleDriveListResponse> {
  const params = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: "files(id,name,modifiedTime)",
    pageSize: "100",
  });
  return googleFetch(accessToken, `https://www.googleapis.com/drive/v3/files?${params}`);
}

export async function fetchGoogleDriveFilesInFolder(
  accessToken: string,
  folderId: string,
): Promise<GoogleDriveListResponse> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
    fields: "files(id,name,mimeType,modifiedTime,webViewLink,size,parents)",
    pageSize: "100",
  });
  return googleFetch(accessToken, `https://www.googleapis.com/drive/v3/files?${params}`);
}
