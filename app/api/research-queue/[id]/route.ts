import { NextResponse } from "next/server";
import { isErrorResponse, jsonError, requireAuthUserId } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";
import { nowIso } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const repos = await getServerRepositories();
  const item = await repos.researchQueue.getById(userId, id);
  if (!item) return jsonError("Research item not found", 404);
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  const { id } = await params;
  const body = (await request.json()) as { status?: string; action?: string };

  const repos = await getServerRepositories();
  const existing = await repos.researchQueue.getById(userId, id);
  if (!existing) return jsonError("Research item not found", 404);

  if (body.action === "approve") {
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
  } else if (body.action === "reject") {
    await repos.researchQueue.reject(userId, id);
    await repos.brainActivity.add(userId, "Discarded research", existing.title);
  } else if (body.action === "save-memory") {
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
  } else if (body.status) {
    await repos.researchQueue.updateStatus(
      userId,
      id,
      body.status as typeof existing.status,
    );
  } else {
    return jsonError("Provide action or status");
  }

  const updated = await repos.researchQueue.getById(userId, id);
  return NextResponse.json(updated);
}
