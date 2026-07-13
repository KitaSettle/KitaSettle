import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { getAuthUserReady } from "@/lib/auth/ensure-user-ready";
import { getSchemaHealthReport } from "@/lib/database/schema-health";
import { createClient } from "@/lib/supabase/server";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const gate = await requireAuthUserId();
  if (isErrorResponse(gate)) return gate;

  const ready = await getAuthUserReady();
  if (ready instanceof NextResponse) {
    const payload = (await ready.json().catch(() => null)) as {
      error?: string;
      bootstrap?: unknown;
    } | null;

    const schema = await getSchemaHealthReport();
    return NextResponse.json({
      authenticated: true,
      schema,
      bootstrapAttempted: true,
      bootstrapResult: payload?.bootstrap ?? null,
      hasDatabaseUrl: Boolean(
        process.env.POSTGRES_URL_NON_POOLING?.trim() ||
          process.env.POSTGRES_URL?.trim() ||
          process.env.DATABASE_URL?.trim(),
      ),
      error: payload?.error ?? "Not ready",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const repos = await getServerRepositories();
  const [schema, profile, dnaProfile] = await Promise.all([
    getSchemaHealthReport(),
    repos.users.getProfile(ready.userId),
    repos.executiveDna.getProfile(ready.userId),
  ]);

  return NextResponse.json({
    authenticated: true,
    userId: ready.userId,
    email: user?.email ?? null,
    schema,
    hasPublicUsersRow: Boolean(profile),
    hasDnaProfile: Boolean(dnaProfile),
    bootstrapAttempted: true,
    bootstrapResult: ready.bootstrap,
    hasDatabaseUrl: Boolean(
      process.env.POSTGRES_URL_NON_POOLING?.trim() ||
        process.env.POSTGRES_URL?.trim() ||
        process.env.DATABASE_URL?.trim(),
    ),
    profile,
    dnaOverallConfidence: dnaProfile?.overallConfidence ?? 0,
  });
}
