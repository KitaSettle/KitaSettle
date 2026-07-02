import { NextResponse } from "next/server";
import { isErrorResponse } from "@/lib/api/auth";
import { getAdminRepositories } from "@/lib/admin/admin-repositories";
import { requireAdminUserId } from "@/lib/admin/admin-guard";
import { createMissionControlService } from "@/lib/mission-control";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const adminId = await requireAdminUserId();
  if (isErrorResponse(adminId)) return adminId;

  try {
    const repos = getAdminRepositories();
    const service = createMissionControlService(repos.analytics);
    const payload = await service.getDashboard();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Mission Control";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
