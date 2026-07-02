import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { assertServerSecretsNotPublic, env, isSupabaseConfigured } from "@/lib/config/env";
import { MOCK_AUTH_COOKIE, MOCK_USER_ID } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/server";
import { assertUserNotDisabled } from "@/lib/admin/admin-guard";

export async function requireAuthUserId(): Promise<string | NextResponse> {
  assertServerSecretsNotPublic();

  if (!isSupabaseConfigured()) {
    if (env.isProduction) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    if (!cookieStore.get(MOCK_AUTH_COOKIE)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return MOCK_USER_ID;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await assertUserNotDisabled(user.id);
  if (!allowed) {
    return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
  }

  return user.id;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
