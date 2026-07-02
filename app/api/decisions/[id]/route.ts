import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { createDecisionEngine } from "@/lib/decision-engine";
import type { DecisionLearningEventType } from "@/lib/types/decision-engine";
import { getServerRepositories } from "@/lib/repositories/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_EVENTS: DecisionLearningEventType[] = ["completed", "ignored", "delayed", "rejected"];

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const body = (await request.json()) as { action?: DecisionLearningEventType; reason?: string };
  if (!body.action || !VALID_EVENTS.includes(body.action)) {
    return jsonError("Provide action: completed, ignored, delayed, or rejected");
  }

  try {
    const repos = await getServerRepositories();
    const engine = createDecisionEngine(repos);
    const updated = await engine.applyOutcome(
      userId,
      id,
      body.action,
      body.reason ?? `Decision marked as ${body.action}.`,
    );
    if (!updated) return jsonError("Decision not found", 404);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
