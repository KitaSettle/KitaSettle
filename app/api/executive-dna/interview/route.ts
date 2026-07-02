import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const engine = createExecutiveDNAEngine(repos);
    const response = await engine.interviewService.start(userId);
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start discovery interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const body = (await request.json()) as { answer?: string };
  if (!body.answer?.trim()) {
    return jsonError("Answer is required");
  }

  try {
    const repos = await getServerRepositories();
    const engine = createExecutiveDNAEngine(repos);
    const response = await engine.interviewService.answer(userId, body.answer.trim());
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process discovery answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
