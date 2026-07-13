import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { applyAllMigrations, backfillExistingAuthUsers } from "@/lib/database/apply-migrations";
import { getSchemaHealthReport } from "@/lib/database/schema-health";
import { enforceRateLimit } from "@/lib/security/secure-route";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, null, "mutation");
  if (limited) return limited;

  const before = await getSchemaHealthReport();
  if (before.ready) {
    const userId = await requireAuthUserId();
    if (isErrorResponse(userId)) return userId;

    return NextResponse.json({
      status: "already_applied",
      message: "Schema is already present.",
      before,
    });
  }

  const setupToken = process.env.SCHEMA_SETUP_TOKEN?.trim();
  const providedToken = request.headers.get("x-kita-setup-token")?.trim();
  const userId = await requireAuthUserId();
  const isAuthenticated = !isErrorResponse(userId);
  const hasValidSetupToken = Boolean(setupToken) && providedToken === setupToken;

  if (!isAuthenticated && !hasValidSetupToken) {
    return NextResponse.json(
      { error: "Schema setup requires sign-in or a valid setup token while tables are missing." },
      { status: 401 },
    );
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
      requestedBy: isAuthenticated ? userId : "anonymous",
      email: user?.email,
      migrationResult,
      backfilledUsers,
      after,
      hasDatabaseUrl: Boolean(
        process.env.POSTGRES_URL_NON_POOLING?.trim() ||
          process.env.POSTGRES_URL?.trim() ||
          process.env.DATABASE_URL?.trim(),
      ),
    });

    return NextResponse.json({
      status: after.ready ? "applied" : "partial",
      migrationResult,
      backfilledUsers,
      before,
      after,
      hasDatabaseUrl: Boolean(
        process.env.POSTGRES_URL_NON_POOLING?.trim() ||
          process.env.POSTGRES_URL?.trim() ||
          process.env.DATABASE_URL?.trim(),
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply schema";
    console.error("[KitaSettle] Schema apply failed:", {
      error,
      hasDatabaseUrl: Boolean(
        process.env.POSTGRES_URL_NON_POOLING?.trim() ||
          process.env.POSTGRES_URL?.trim() ||
          process.env.DATABASE_URL?.trim(),
      ),
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const report = await getSchemaHealthReport();
  return NextResponse.json({
    ...report,
    hasDatabaseUrl: Boolean(
      process.env.POSTGRES_URL_NON_POOLING?.trim() ||
        process.env.POSTGRES_URL?.trim() ||
        process.env.DATABASE_URL?.trim(),
    ),
  });
}
