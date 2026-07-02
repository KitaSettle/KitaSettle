import { NextResponse } from "next/server";
import { isErrorResponse, jsonError } from "@/lib/api/auth";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import { getServerRepositories } from "@/lib/repositories/server";
import { nowIso } from "@/lib/utils";
import { requireAuthenticatedUser, writeAudit } from "@/lib/security/secure-route";
import { parseJsonBody, researchQueuePatchSchema } from "@/lib/security/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const repos = await getServerRepositories();
  const item = await repos.researchQueue.getById(userId, id);
  if (!item) return jsonError("Research item not found", 404);

  await writeAudit(userId, "data_access", "research_queue", "read", { itemId: id }, request);
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthenticatedUser(request, "mutation");
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = parseJsonBody(researchQueuePatchSchema, body);
  if (!parsed.success) return jsonError(parsed.error);

  const repos = await getServerRepositories();
  const dnaEngine = createExecutiveDNAEngine(repos);
  const existing = await repos.researchQueue.getById(userId, id);
  if (!existing) return jsonError("Research item not found", 404);

  if (parsed.data.action === "approve") {
    await repos.researchQueue.approve(userId, id);
    await repos.memory.create(
      userId,
      {
        title: existing.title,
        description: existing.summary,
        category: "Research",
        importance: existing.importance,
        relatedKnowledge: [],
        status: "active",
      },
      existing.tags,
    );
    await repos.knowledge.create(userId, {
      title: existing.title,
      summary: existing.summary,
      content: existing.summary,
      source: existing.source,
      url: existing.sourceUrl,
      category: "Research",
      subcategory: existing.source,
      confidence: existing.confidence,
      publishedDate: nowIso(),
      lastReviewed: nowIso(),
      relatedItems: [],
      tags: existing.tags,
      importance: existing.importance,
    });
    await repos.brainActivity.add(userId, "Saved to Executive Brain", existing.title);
    await dnaEngine.learningService.observeApproval(userId, existing.tags, existing.source);
    await writeAudit(userId, "approval", "research_queue", "approve", { itemId: id }, request);
  } else if (parsed.data.action === "reject") {
    await repos.researchQueue.reject(userId, id);
    await repos.brainActivity.add(userId, "Discarded research", existing.title);
    await dnaEngine.learningService.observeRejection(userId, existing.tags, existing.title);
    await writeAudit(userId, "rejection", "research_queue", "reject", { itemId: id }, request);
  } else if (parsed.data.action === "save-memory") {
    await repos.memory.create(
      userId,
      {
        title: existing.title,
        description: existing.summary,
        category: "Research",
        importance: existing.importance,
        relatedKnowledge: [],
        status: "active",
      },
      existing.tags,
    );
    await repos.brainActivity.add(userId, "Saved to memory", existing.title);
    await writeAudit(userId, "approval", "research_queue", "save-memory", { itemId: id }, request);
  } else if (parsed.data.status) {
    await repos.researchQueue.updateStatus(
      userId,
      id,
      parsed.data.status as typeof existing.status,
    );
  } else {
    return jsonError("Provide action or status");
  }

  const updated = await repos.researchQueue.getById(userId, id);
  return NextResponse.json(updated);
}
