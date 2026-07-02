import { NextResponse } from "next/server";
import { z } from "zod";
import { env, isSupabaseConfigured } from "@/lib/config/env";
import { enforceRateLimit } from "@/lib/security/secure-route";
import type { AccountHint } from "@/lib/auth/errors";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, null, "auth");
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ exists: null, hasEmailPassword: false, oauthProviders: [] });
  }

  let email: string;
  try {
    const body = await request.json();
    email = bodySchema.parse(body).email;
  } catch {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  try {
    const filter = encodeURIComponent(`email.eq.${email}`);
    const response = await fetch(
      `${env.supabaseUrl}/auth/v1/admin/users?filter=${filter}&page=1&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
          apikey: env.supabaseAnonKey,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({ exists: null, hasEmailPassword: false, oauthProviders: [] });
    }

    const payload = (await response.json()) as { users?: Array<{ identities?: Array<{ provider?: string }> }> };
    const user = payload.users?.[0];

    if (!user) {
      const hint: AccountHint = { exists: false, hasEmailPassword: false, oauthProviders: [] };
      return NextResponse.json(hint);
    }

    const providers = (user.identities ?? [])
      .map((identity) => identity.provider)
      .filter((provider): provider is string => Boolean(provider));

    const hint: AccountHint = {
      exists: true,
      hasEmailPassword: providers.includes("email"),
      oauthProviders: providers.filter((provider) => provider !== "email"),
    };

    return NextResponse.json(hint);
  } catch {
    return NextResponse.json({ exists: null, hasEmailPassword: false, oauthProviders: [] });
  }
}
