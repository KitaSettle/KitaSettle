import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config/env";
import { getServerRepositories } from "./server";
import {
  MockTransparencyRepository,
  SupabaseTransparencyRepository,
  type TransparencyRepository,
} from "./transparency-repository";

export async function getTransparencyRepository(): Promise<TransparencyRepository> {
  const repos = await getServerRepositories();

  if (!isSupabaseConfigured()) {
    return new MockTransparencyRepository(repos);
  }

  const client = await createClient();
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch {
    adminClient = undefined;
  }

  return new SupabaseTransparencyRepository(repos, client, adminClient);
}
