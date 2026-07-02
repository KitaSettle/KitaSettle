import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertServerSecretsNotPublic, isSupabaseConfigured } from "@/lib/config/env";
import { requireAuthUserId, isErrorResponse } from "@/lib/api/auth";
import { createAuditRepository, recordAuditEvent } from "./audit-log";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  type RateLimitConfig,
} from "./rate-limit";
import type { AuditEventType } from "./types";

export async function enforceRateLimit(
  request: Request,
  userId: string | null,
  bucket: keyof typeof RATE_LIMITS,
): Promise<NextResponse | null> {
  const config: RateLimitConfig = RATE_LIMITS[bucket];
  const ip = getClientIp(request) ?? "unknown";
  const key = `${bucket}:${userId ?? ip}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    if (isSupabaseConfigured()) {
      const client = await createClient();
      const audit = createAuditRepository(client);
      await recordAuditEvent(audit, {
        userId,
        eventType: "rate_limited",
        resource: bucket,
        action: "blocked",
        ipAddress: ip,
      });
    }

    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  return null;
}

export async function requireAuthenticatedUser(
  request: Request,
  bucket: keyof typeof RATE_LIMITS = "mutation",
): Promise<string | NextResponse> {
  assertServerSecretsNotPublic();
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const limited = await enforceRateLimit(request, userId, bucket);
  if (limited) return limited;

  return userId;
}

export async function writeAudit(
  userId: string | null,
  eventType: AuditEventType,
  resource: string,
  action: string,
  metadata: Record<string, unknown> = {},
  request?: Request,
): Promise<void> {
  const client = isSupabaseConfigured() ? await createClient() : undefined;
  const audit = createAuditRepository(client);
  await recordAuditEvent(audit, {
    userId,
    eventType,
    resource,
    action,
    metadata,
    ipAddress: request ? getClientIp(request) : null,
  });
}
