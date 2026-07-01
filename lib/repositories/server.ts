import { createClient } from "@/lib/supabase/server";
import { createRepositories, type Repositories } from "./index";

export async function getServerRepositories(): Promise<Repositories> {
  const client = await createClient();
  return createRepositories(client);
}
