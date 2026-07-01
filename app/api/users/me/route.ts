import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const profile = await repos.users.getProfile(userId);
    return NextResponse.json(profile);
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
