export const DEFAULT_POST_LOGIN_PATH = "/dashboard/discovery";

export function resolvePostLoginPath(next?: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return DEFAULT_POST_LOGIN_PATH;
}
