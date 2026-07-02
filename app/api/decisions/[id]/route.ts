import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { createDecisionEngine } from "@/lib/decision-engine";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { decisionActionSchema, parseJsonBody } from "@/lib/security/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(decisionActionSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  try {
    const repos = await getServerRepositories();
    const engine = createDecisionEngine(repos);
    const updated = await engine.applyOutcome(
      userId,
      id,
      parsed.data.action,
      parsed.data.reason ?? `Decision marked as ${parsed.data.action}.`,
    );
    if (!updated) return jsonError("Decision not found", 404);

    await writeAudit(
      userId,
      parsed.data.action === "rejected" ? "rejection" : "approval",
      "decisions",
      parsed.data.action,
      { decisionId: id },
      request,
    );

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
