import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { createIntegrationManager } from "@/lib/integrations";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser } from "@/lib/security/secure-route";
import { folderSelectionSchema, parseJsonBody } from "@/lib/security/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireAuthenticatedUser(request, "integration");
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
  const userId = await requireAuthenticatedUser(request, "integration");
  if (isErrorResponse(userId)) return userId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(folderSelectionSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  try {
    const repos = await getServerRepositories();
    const manager = createIntegrationManager(repos);
    await manager.documents.setSelectedFolders(userId, parsed.data.folderIds);
    await manager.documents.syncSelectedFolders(userId);
    const folders = await manager.documents.listFolders(userId);
    return NextResponse.json(folders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
