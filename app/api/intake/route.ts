import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { AiBudgetExceededError } from "@/lib/ai/budget";
import { createIntakeService } from "@/lib/intake";
import {
  extractFromFile,
  extractFromText,
  extractFromUrl,
} from "@/lib/intake/content-extractor";
import { recordOperationalError } from "@/lib/observability/record-error";
import { getServerRepositories } from "@/lib/repositories/server";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { intakeJsonSchema, parseJsonBody } from "@/lib/security/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_INTAKE_TEXT = 20_000;

export async function POST(request: Request) {
  const userId = await requireAuthenticatedUser(request, "ai");
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const intakeService = createIntakeService(repos);
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const url = formData.get("url");
      const text = formData.get("text");

      if (file instanceof File && file.size > 0) {
        const extracted = await extractFromFile(file);
        const result = await intakeService.delegate(userId, extracted);
        await writeAudit(userId, "data_access", "intake", "delegate_file", { intakeId: result.intakeId }, request);
        return NextResponse.json(result, { status: 201 });
      }

      if (typeof url === "string" && url.trim()) {
        if (url.trim().length > 2048) {
          return jsonError("That link is too long.");
        }
        const extracted = await extractFromUrl(url.trim());
        const result = await intakeService.delegate(userId, extracted);
        await writeAudit(userId, "data_access", "intake", "delegate_url", { intakeId: result.intakeId }, request);
        return NextResponse.json(result, { status: 201 });
      }

      if (typeof text === "string" && text.trim()) {
        if (text.trim().length > MAX_INTAKE_TEXT) {
          return jsonError("That text is too long. Try a shorter excerpt.");
        }
        const extracted = await extractFromText(text.trim(), "paste", "Pasted content");
        const result = await intakeService.delegate(userId, extracted);
        await writeAudit(userId, "data_access", "intake", "delegate_paste", { intakeId: result.intakeId }, request);
        return NextResponse.json(result, { status: 201 });
      }

      return jsonError("Share a file, link, or some text for Kita to work with.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Something went wrong sending that to Kita. Please try again.");
    }

    const parsed = parseJsonBody(intakeJsonSchema, body);
    if (!parsed.success) return jsonError(parsed.error);

    const extracted =
      parsed.data.type === "url"
        ? await extractFromUrl(parsed.data.content)
        : await extractFromText(
            parsed.data.content,
            parsed.data.type,
            parsed.data.label ?? "Delegated content",
          );

    const result = await intakeService.delegate(userId, extracted);
    await writeAudit(
      userId,
      "data_access",
      "intake",
      `delegate_${parsed.data.type}`,
      { intakeId: result.intakeId },
      request,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AiBudgetExceededError) {
      return NextResponse.json(
        { error: "Kita is at capacity right now. Your note was saved — try again in a few minutes." },
        { status: 429 },
      );
    }

    await recordOperationalError({
      source: "intake.delegate",
      message: error instanceof Error ? error.message : "Intake delegation failed",
      userId: isErrorResponse(userId) ? null : userId,
      retryable: true,
    });

    return NextResponse.json(
      { error: "Kita couldn't process that just now. Please try again." },
      { status: 500 },
    );
  }
}
