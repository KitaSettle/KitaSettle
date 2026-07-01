import { resolveRepositories } from "./factory";
import type { Repositories } from "./index";

export async function getServerRepositories(): Promise<Repositories> {
  return resolveRepositories();
}

export type { Repositories };
