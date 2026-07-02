import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { getAdminRepositories } from "@/lib/admin/admin-repositories";
import { requireAdminUserId } from "@/lib/admin/admin-guard";
import { parseJsonBody } from "@/lib/security/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const betaActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    email: z.string().email(),
    profession: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("disable"),
    userId: z.string().uuid(),
    disabled: z.boolean(),
  }),
  z.object({
    action: z.literal("set_budget"),
    userId: z.string().uuid(),
    dailyAiBudgetUsd: z.number().min(0).max(100),
  }),
  z.object({
    action: z.literal("set_notes"),
    userId: z.string().uuid(),
    betaNotes: z.string().trim().max(1000),
  }),
  z.object({
    action: z.literal("set_default_budget"),
    dailyAiBudgetUsd: z.number().min(0).max(100),
  }),
]);

export async function POST(request: Request) {
  const adminId = await requireAdminUserId();
  if (isErrorResponse(adminId)) return adminId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(betaActionSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  const repos = getAdminRepositories();

  try {
    switch (parsed.data.action) {
      case "invite":
        await repos.beta.inviteUser(parsed.data.email, parsed.data.profession, parsed.data.notes, adminId);
        break;
      case "disable":
        await repos.beta.disableUser(parsed.data.userId, parsed.data.disabled);
        break;
      case "set_budget":
        await repos.beta.setDailyBudget(parsed.data.userId, parsed.data.dailyAiBudgetUsd);
        break;
      case "set_notes":
        await repos.beta.updateBetaNotes(parsed.data.userId, parsed.data.betaNotes);
        break;
      case "set_default_budget":
        await repos.beta.setDefaultDailyBudget(parsed.data.dailyAiBudgetUsd);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Beta action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
