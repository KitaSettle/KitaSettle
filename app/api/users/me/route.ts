import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { ensureUserBootstrapped } from "@/lib/auth/bootstrap-user";
import { createClient } from "@/lib/supabase/server";
import { getServerRepositories } from "@/lib/repositories/server";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metadataName =
      typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null;

    await ensureUserBootstrapped(userId, user.email, metadataName);

    const repos = await getServerRepositories();
    const profile = await repos.users.getProfile(userId);

    if (profile) {
      return NextResponse.json(profile);
    }

    return NextResponse.json({
      name: metadataName?.trim() || user.email?.split("@")[0] || "Executive",
      email: user.email ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const body = (await request.json()) as { name?: string; email?: string };
    if (!body.name?.trim() || !body.email?.trim()) {
      return jsonError("Name and email are required");
    }

    const repos = await getServerRepositories();
    const profile = await repos.users.upsertProfile(userId, {
      name: body.name.trim(),
      email: body.email.trim(),
    });
    return NextResponse.json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
