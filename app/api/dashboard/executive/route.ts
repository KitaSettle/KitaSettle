import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { generateIfMissing } from "@/lib/executive/daily-brief-service";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const payload = await generateIfMissing(userId, repos);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load daily executive brief";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
