import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureUserBootstrapped } from "./bootstrap-user";

export async function requireAuthUserReady(): Promise<string | NextResponse> {
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

  const metadataName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null;

  await ensureUserBootstrapped(userId, user.email, metadataName);
  return userId;
}
