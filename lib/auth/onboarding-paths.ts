const ONBOARDING_ALLOWED_PREFIXES = [
  "/dashboard/discovery",
  "/dashboard/settings",
] as const;

export function isOnboardingAllowedPath(pathname: string): boolean {
  if (!pathname) return false;
  return ONBOARDING_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
