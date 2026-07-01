import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";
import { assembleExecutiveBrainData } from "@/lib/executive-brain/assemble-brain-data";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const data = await assembleExecutiveBrainData(userId, repos);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Executive Brain";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
