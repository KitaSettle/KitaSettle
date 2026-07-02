import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureUserBootstrapped, type BootstrapResult } from "./bootstrap-user";
import { ensureSchemaReady } from "@/lib/database/ensure-schema-ready";

export interface UserReadyResult {
  userId: string;
  bootstrap: BootstrapResult;
}

export async function requireAuthUserReady(): Promise<string | NextResponse> {
  const result = await getAuthUserReady();
  if (result instanceof NextResponse) return result;
  return result.userId;
}

export async function getAuthUserReady(): Promise<UserReadyResult | NextResponse> {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schema = await ensureSchemaReady();
  if (!schema.ready) {
    return NextResponse.json(
      {
        error:
          "Database schema is missing on Supabase. Sign in and POST /api/setup/apply-schema, or run migrations in Supabase SQL editor.",
        schema,
      },
      { status: 503 },
    );
  }

  const metadataName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

  const bootstrap = await ensureUserBootstrapped(userId, user.email, metadataName);

  if (!bootstrap.ok) {
    console.error("[KitaSettle] User bootstrap failed:", {
      userId,
      email: user.email,
      bootstrap,
    });
    return NextResponse.json(
      {
        error: bootstrap.error ?? "Failed to prepare your account.",
        bootstrap,
      },
      { status: 503 },
    );
  }

  return { userId, bootstrap };
}
