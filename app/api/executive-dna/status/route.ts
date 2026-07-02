import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import {
  DEFAULT_EXECUTIVE_DNA_STATUS,
  withExecutiveDnaFallback,
} from "@/lib/executive-dna/defaults";
import { getServerRepositories } from "@/lib/repositories/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const engine = createExecutiveDNAEngine(repos);
    const status = await withExecutiveDnaFallback(
      () => engine.getStatus(userId),
      DEFAULT_EXECUTIVE_DNA_STATUS,
    );
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Executive DNA status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
