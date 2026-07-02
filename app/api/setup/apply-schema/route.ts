import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { applyAllMigrations, backfillExistingAuthUsers } from "@/lib/database/apply-migrations";
import { getSchemaHealthReport } from "@/lib/database/schema-health";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const before = await getSchemaHealthReport();
  if (before.ready) {
    return NextResponse.json({
      status: "already_applied",
      message: "Schema is already present.",
      before,
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const migrationResult = await applyAllMigrations();
    const backfilledUsers = await backfillExistingAuthUsers();
    const after = await getSchemaHealthReport();

    console.info("[KitaSettle] Schema apply completed", {
      requestedBy: userId,
      email: user?.email,
      migrationResult,
      backfilledUsers,
      after,
    });

    return NextResponse.json({
      status: after.ready ? "applied" : "partial",
      migrationResult,
      backfilledUsers,
      before,
      after,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply schema";
    console.error("[KitaSettle] Schema apply failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const report = await getSchemaHealthReport();
  return NextResponse.json(report);
}
