import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const repos = await getServerRepositories();
  const item = await repos.knowledge.getById(userId, id);
  if (!item) return jsonError("Knowledge item not found", 404);

  await writeAudit(userId, "data_access", "knowledge", "read", { itemId: id }, request);
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const body = await request.json();
  const repos = await getServerRepositories();
  const item = await repos.knowledge.update(userId, id, body);
  if (!item) return jsonError("Knowledge item not found", 404);
  return NextResponse.json(item);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const repos = await getServerRepositories();
  const deleted = await repos.knowledge.delete(userId, id);
  if (!deleted) return jsonError("Knowledge item not found", 404);

  await writeAudit(userId, "deletion", "knowledge", "delete", { itemId: id }, request);
  return NextResponse.json({ success: true });
}
