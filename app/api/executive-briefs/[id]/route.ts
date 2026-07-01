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
  const brief = await repos.executiveBriefs.getById(userId, id);
  if (!brief) return jsonError("Brief not found", 404);
  return NextResponse.json(brief);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const body = await request.json();
  const repos = await getServerRepositories();
  const brief = await repos.executiveBriefs.update(userId, id, body);
  if (!brief) return jsonError("Brief not found", 404);
  return NextResponse.json(brief);
}
