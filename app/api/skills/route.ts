import { NextResponse } from "next/server";
import { isErrorResponse, requireAuthUserId } from "@/lib/api/auth";
import { getServerRepositories } from "@/lib/repositories/server";

export async function GET() {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const repos = await getServerRepositories();
    const items = await repos.skills.listSkills(userId);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load skills";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await requireAuthUserId();
  if (isErrorResponse(userId)) return userId;

  try {
    const body = await request.json();
    const repos = await getServerRepositories();
    const item = await repos.skills.create(userId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create skill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
