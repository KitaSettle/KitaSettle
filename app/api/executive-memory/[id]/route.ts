import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const repos = await getServerRepositories();
  const item = await repos.memory.getById(userId, id);
  if (!item) return jsonError("Memory item not found", 404);
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const body = await request.json();
  const repos = await getServerRepositories();
  const item = await repos.memory.update(userId, id, body);
  if (!item) return jsonError("Memory item not found", 404);
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const repos = await getServerRepositories();
  const item = await repos.memory.archive(userId, id);
  if (!item) return jsonError("Memory item not found", 404);
  return NextResponse.json(item);
}
