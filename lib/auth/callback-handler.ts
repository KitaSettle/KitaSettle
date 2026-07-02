import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, writeAudit } from "@/lib/security/secure-route";

const DEFAULT_NEXT = "/dashboard/executive";
const RESET_PASSWORD_PATH = "/reset-password";

function resolveRedirectPath(next: string | null, type: string | null): string {
  if (type === "recovery" || next === RESET_PASSWORD_PATH) {
    return RESET_PASSWORD_PATH;
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return DEFAULT_NEXT;
}

export async function handleAuthCallback(request: Request): Promise<NextResponse> {
  const limited = await enforceRateLimit(request, null, "auth");
  if (limited) return limited;

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const type = searchParams.get("type");

  if (!code) {
    const query = searchParams.toString();
    const suffix = query ? `?${query}` : "";
    return NextResponse.redirect(`${origin}/auth/confirm${suffix}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const redirectPath = resolveRedirectPath(next, type);
  const auditAction = redirectPath === RESET_PASSWORD_PATH ? "password_recovery" : "success";

  await writeAudit(data.user.id, "login", "auth", auditAction, { redirectPath }, request);

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
