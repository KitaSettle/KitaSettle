import { env } from "@/lib/config/env";

export function assertSameOriginMutation(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const allowed = new URL(env.appUrl);
    const incoming = new URL(origin);
    return incoming.origin === allowed.origin;
  } catch {
    return false;
  }
}
