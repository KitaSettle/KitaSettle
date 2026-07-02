import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { MOCK_AUTH_COOKIE, MOCK_USER_ID } from "@/lib/auth/constants";
import { env, isSupabaseConfigured } from "@/lib/config/env";

function parseAllowlist(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getAdminEmails(): string[] {
  return parseAllowlist(process.env.ADMIN_EMAILS);
}

export async function isAdminUser(userId: string, email?: string | null): Promise<boolean> {
  if (getAdminUserIds().includes(userId)) return true;
  if (email && getAdminEmails().includes(email.toLowerCase())) return true;

  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    return cookieStore.get(MOCK_AUTH_COOKIE) != null && userId === MOCK_USER_ID;
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("is_admin").eq("id", userId).maybeSingle();
    return Boolean(data?.is_admin);
  } catch {
    return false;
  }
}

export async function requireAdminUserId(): Promise<string | NextResponse> {
  if (env.isProduction && getAdminUserIds().length === 0 && getAdminEmails().length === 0) {
    return NextResponse.json({ error: "Mission Control is not configured." }, { status: 503 });
  }

  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  let email: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }

  const allowed = await isAdminUser(userId, email);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return userId;
}

export async function assertUserNotDisabled(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("users").select("is_disabled").eq("id", userId).maybeSingle();
    return !data?.is_disabled;
  } catch {
    return true;
  }
}
