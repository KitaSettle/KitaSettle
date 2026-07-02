import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { requireAuthUserReady } from "@/lib/auth/ensure-user-ready";
import { getServerRepositories } from "@/lib/repositories/server";
import { getTransparencyRepository } from "@/lib/repositories/transparency-factory";
import { createTrustCenterService } from "@/lib/trust-center";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserReady();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const transparency = await getTransparencyRepository();
    const service = createTrustCenterService(repos, transparency);
    const payload = await service.getDashboard(userId);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Trust Center";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
