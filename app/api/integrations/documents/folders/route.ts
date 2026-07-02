import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { createIntegrationManager } from "@/lib/integrations";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    const folders = await manager.documents.listFolders(userId);
    return NextResponse.json(folders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const body = (await request.json()) as { folderIds?: string[] };
  if (!Array.isArray(body.folderIds)) {
    return jsonError("folderIds array is required");
  }

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    await manager.documents.setSelectedFolders(userId, body.folderIds);
    await manager.documents.syncSelectedFolders(userId);
    const folders = await manager.documents.listFolders(userId);
    return NextResponse.json(folders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
