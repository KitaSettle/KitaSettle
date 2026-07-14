import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { requireAuthUserReady } from "@/lib/auth/ensure-user-ready";
import { createTalkToKitaService } from "@/lib/kita/talk-service";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { parseJsonBody } from "@/lib/security/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 45;

const talkMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export async function GET(request: Request) {
  const authUserId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(authUserId)) return authUserId;

  const userId = await requireAuthUserReady();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const service = createTalkToKitaService(repos);
    const payload = await service.loadConversation(userId);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[KitaSettle] Failed to load Talk to Kita conversation:", error);
    const message = error instanceof Error ? error.message : "Failed to load conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authUserId = await requireAuthenticatedUser(request, "ai");
  if (isErrorResponse(authUserId)) return authUserId;

  const userId = await requireAuthUserReady();
  if (isErrorResponse(userId)) return userId;

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("[KitaSettle] Talk to Kita invalid JSON:", error);
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(talkMessageSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  try {
    const repos = await getServerRepositories();
    const service = createTalkToKitaService(repos);
    const payload = await service.sendMessage(userId, parsed.data.message);
    await writeAudit(userId, "ai_generation", "kita_chat", "message", {}, request);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[KitaSettle] Failed to send Talk to Kita message:", error);
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
