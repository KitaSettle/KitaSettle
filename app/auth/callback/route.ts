import { handleAuthCallback } from "@/lib/auth/callback-handler";

export async function GET(request: Request) {
  return handleAuthCallback(request);
}
