import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { requireAuthUserReady } from "@/lib/auth/ensure-user-ready";
import { getServerRepositories } from "@/lib/repositories/server";
import { assembleExecutiveBrainData } from "@/lib/executive-brain/assemble-brain-data";
import { requireAuthenticatedUser } from "@/lib/security/secure-route";

export async function GET(request: Request) {
  const authUserId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(authUserId)) return authUserId;

  const userId = await requireAuthUserReady();
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
