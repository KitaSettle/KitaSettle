import { isSupabaseConfigured } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { createScriptClient } from "@/lib/supabase/script";
import { createMockRepositories } from "./mock";
import { createRepositories, type Repositories } from "./index";

export async function resolveRepositories(): Promise<Repositories> {
  if (!isSupabaseConfigured()) {
    return createMockRepositories();
  }

  const client = await createClient();
  return createRepositories(client);
}

export function resolveScriptRepositories(): Repositories {
  if (!isSupabaseConfigured()) {
    return createMockRepositories();
  }

  return createRepositories(createScriptClient());
}
