export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function matchesAnyField(
  query: string | undefined,
  fields: string[],
  tags: string[] = [],
): boolean {
  if (!query?.trim()) return true;

  const normalized = query.trim().toLowerCase();

  if (tags.some((tag) => tag.toLowerCase().includes(normalized))) {
    return true;
  }

  return fields.some((field) => field.toLowerCase().includes(normalized));
}
