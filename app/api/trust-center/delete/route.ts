import { NextResponse } from "next/server";
import { z } from "zod";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { getTransparencyRepository } from "@/lib/repositories/transparency-factory";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { parseJsonBody } from "@/lib/security/validation";
import { createDeletionService } from "@/lib/trust-center";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const deleteSchema = z.object({
  scope: z.enum(["documents", "knowledge", "memory", "account"]),
  confirm: z.literal(true),
});

export async function POST(request: Request) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(deleteSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  try {
    const transparency = await getTransparencyRepository();
    const service = createDeletionService(transparency);
    const result = await service.delete(userId, parsed.data.scope);

    await writeAudit(
      userId,
      "deletion",
      parsed.data.scope,
      "success",
      { deletedCount: result.deletedCount },
      request,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete deletion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
