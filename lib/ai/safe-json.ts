export function parseJsonObject<T extends Record<string, unknown>>(
  raw: string | null | undefined,
  fallback: T,
): T {
  if (!raw?.trim()) return fallback;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
