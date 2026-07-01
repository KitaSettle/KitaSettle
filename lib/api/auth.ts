import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireAuthUserId(): Promise<string | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return user.id;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
