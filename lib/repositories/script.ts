import { createScriptClient } from "@/lib/supabase/script";
import { createRepositories, type Repositories } from "./index";

let cached: Repositories | null = null;

export function getScriptRepositories(): Repositories {
  if (!cached) {
    cached = createRepositories(createScriptClient());
  }
  return cached;
}
