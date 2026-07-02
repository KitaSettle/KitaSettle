import { cookies } from "next/headers";

const COOKIE_NAME = "kitasettle-google-oauth-state";

export async function createOAuthState(userId: string): Promise<string> {
  const state = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomUUID() })).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return state;
}

export async function verifyOAuthState(state: string): Promise<string | null> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(COOKIE_NAME)?.value;
  cookieStore.delete(COOKIE_NAME);
  if (!saved || saved !== state) return null;

  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as {
      userId?: string;
    };
    return parsed.userId ?? null;
  } catch {
    return null;
  }
}
