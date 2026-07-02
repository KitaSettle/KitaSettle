import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import { getServerRepositories } from "@/lib/repositories/server";
import { nowIso } from "@/lib/utils";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { knowledgeCreateSchema, parseJsonBody } from "@/lib/security/validation";

export async function GET(request: Request) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const items = await repos.knowledge.getAll(userId);
    await writeAudit(userId, "data_access", "knowledge", "list", {}, request);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load knowledge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(knowledgeCreateSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  try {
    const repos = await getServerRepositories();
    const item = await repos.knowledge.create(userId, {
      title: parsed.data.title,
      summary: parsed.data.summary ?? "",
      content: parsed.data.content ?? parsed.data.summary ?? "",
      source: parsed.data.source ?? "Manual",
      url: parsed.data.url || "",
      category: parsed.data.category ?? "Knowledge",
      subcategory: parsed.data.subcategory ?? "General",
      confidence: 80,
      publishedDate: nowIso(),
      lastReviewed: nowIso(),
      relatedItems: [],
      tags: parsed.data.tags ?? [],
      importance: "Medium",
    });
    const dnaEngine = createExecutiveDNAEngine(repos);
    await dnaEngine.learningService.observeKnowledgeSaved(
      userId,
      parsed.data.tags ?? [],
      parsed.data.category ?? "Knowledge",
    );
    await writeAudit(userId, "data_access", "knowledge", "create", { itemId: item.id }, request);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create knowledge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
