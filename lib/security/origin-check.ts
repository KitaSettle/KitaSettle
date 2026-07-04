import { env } from "@/lib/config/env";

function collectAllowedOrigins(request: Request): Set<string> {
  const allowed = new Set<string>();

  try {
    allowed.add(new URL(env.appUrl).origin);
  } catch {
    // ignore invalid configured app URL
  }

  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    // ignore invalid request URL
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    try {
      allowed.add(new URL(`${proto}://${host}`).origin);
    } catch {
      // ignore invalid host header
    }
  }

  return allowed;
}

export function assertSameOriginMutation(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const incoming = new URL(origin).origin;
    return collectAllowedOrigins(request).has(incoming);
  } catch {
    return false;
  }
}
