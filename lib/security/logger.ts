const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{10,}/g,
  /Bearer\s+[a-zA-Z0-9._-]+/gi,
  /SUPABASE_SERVICE_ROLE_KEY[=:]\S+/gi,
  /OPENAI_API_KEY[=:]\S+/gi,
  /GOOGLE_CLIENT_SECRET[=:]\S+/gi,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
];

function redactString(value: string): string {
  let next = value;
  for (const pattern of SECRET_PATTERNS) {
    next = next.replace(pattern, "[REDACTED]");
  }
  return next;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (/body|password|token|secret|api[_-]?key|refresh_token|access_token/i.test(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeValue(nested);
      }
    }
    return result;
  }
  return value;
}

export const secureLogger = {
  info(message: string, metadata?: Record<string, unknown>): void {
    if (metadata) {
      console.info(message, sanitizeValue(metadata));
      return;
    }
    console.info(message);
  },
  warn(message: string, metadata?: Record<string, unknown>): void {
    if (metadata) {
      console.warn(message, sanitizeValue(metadata));
      return;
    }
    console.warn(message);
  },
  error(message: string, metadata?: Record<string, unknown>): void {
    if (metadata) {
      console.error(message, sanitizeValue(metadata));
      return;
    }
    console.error(message);
  },
};

export function sanitizeForLog(value: unknown): unknown {
  return sanitizeValue(value);
}
