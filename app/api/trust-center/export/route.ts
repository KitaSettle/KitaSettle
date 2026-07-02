import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";
import { getTransparencyRepository } from "@/lib/repositories/transparency-factory";
import { writeAudit } from "@/lib/security/secure-route";
import { createExportService } from "@/lib/trust-center";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const format = new URL(request.url).searchParams.get("format") ?? "json";

  try {
    const repos = await getServerRepositories();
    const transparency = await getTransparencyRepository();
    const service = createExportService(repos, transparency);

    await writeAudit(userId, "data_access", "trust_center", "export", { format }, request);

    if (format === "zip") {
      const buffer = await service.buildZip(userId);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="kitasettle-export.zip"',
        },
      });
    }

    const json = await service.buildJson(userId);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="kitasettle-export.json"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export your data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
