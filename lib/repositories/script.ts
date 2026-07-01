import { resolveScriptRepositories } from "./factory";
import type { Repositories } from "./index";

export function getScriptRepositories(): Repositories {
  return resolveScriptRepositories();
}

export type { Repositories };
