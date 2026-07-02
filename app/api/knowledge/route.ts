import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";
import { getServerRepositories } from "@/lib/repositories/server";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const items = await repos.knowledge.getAll(userId);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load knowledge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const body = await request.json();
    const repos = await getServerRepositories();
    const item = await repos.knowledge.create(userId, body);
    const dnaEngine = createExecutiveDNAEngine(repos);
    await dnaEngine.learningService.observeKnowledgeSaved(
      userId,
      Array.isArray(body.tags) ? body.tags : [],
      typeof body.category === "string" ? body.category : "Knowledge",
    );
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create knowledge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
