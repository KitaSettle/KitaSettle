import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { requireAuthUserReady } from "@/lib/auth/ensure-user-ready";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { interviewAnswerSchema, parseJsonBody } from "@/lib/security/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const readyUserId = await requireAuthUserReady();
  if (isErrorResponse(readyUserId)) return readyUserId;

  try {
    const repos = await getServerRepositories();
    const engine = createExecutiveDNAEngine(repos);
    const response = await engine.interviewService.start(readyUserId);
    await writeAudit(userId, "data_access", "executive_dna", "interview_start", {}, request);
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start discovery interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await requireAuthenticatedUser(request, "ai");
  if (isErrorResponse(userId)) return userId;

  const readyUserId = await requireAuthUserReady();
  if (isErrorResponse(readyUserId)) return readyUserId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(interviewAnswerSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  try {
    const repos = await getServerRepositories();
    const engine = createExecutiveDNAEngine(repos);
    const response = await engine.interviewService.answer(readyUserId, parsed.data.answer);
    await writeAudit(userId, "ai_generation", "executive_dna", "interview_answer", {}, request);
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process discovery answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
