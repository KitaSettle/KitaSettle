import { env, isSupabaseConfigured } from "@/lib/config/env";

export interface SchemaTableProbe {
  table: string;
  exists: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface SchemaHealthReport {
  configured: boolean;
  ready: boolean;
  tables: SchemaTableProbe[];
  missingTables: string[];
  hint?: string;
}

const REQUIRED_TABLES = [
  "users",
  "executive_dna_profiles",
  "executive_briefs",
  "knowledge",
  "executive_memory",
  "kita_chat_messages",
] as const;

function isMissingTableError(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as { code?: string; message?: string };
  return (
    record.code === "PGRST205" ||
    (record.message?.includes("Could not find the table") ?? false)
  );
}

async function probeTable(table: string): Promise<SchemaTableProbe> {
  try {
    const response = await fetch(
      `${env.supabaseUrl}/rest/v1/${table}?select=id&limit=0`,
      {
        headers: {
          apikey: env.supabaseAnonKey,
          Authorization: `Bearer ${env.supabaseAnonKey}`,
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (response.ok) {
      return { table, exists: true };
    }

    const payload = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    if (isMissingTableError(payload)) {
      return {
        table,
        exists: false,
        errorCode: payload?.code ?? "PGRST205",
        errorMessage: payload?.message,
      };
    }

    return {
      table,
      exists: true,
      errorCode: payload?.code,
      errorMessage: payload?.message,
    };
  } catch (error) {
    return {
      table,
      exists: false,
      errorMessage: error instanceof Error ? error.message : "Probe failed",
    };
  }
}

export async function getSchemaHealthReport(): Promise<SchemaHealthReport> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      ready: false,
      tables: [],
      missingTables: [...REQUIRED_TABLES],
      hint: "Supabase is not configured.",
    };
  }

  const tables = await Promise.all(REQUIRED_TABLES.map((table) => probeTable(table)));
  const missingTables = tables.filter((entry) => !entry.exists).map((entry) => entry.table);
  const ready = missingTables.length === 0;

  return {
    configured: true,
    ready,
    tables,
    missingTables,
    hint: ready
      ? undefined
      : "Database schema has not been applied to hosted Supabase. Run POST /api/setup/apply-schema once while signed in.",
  };
}

export function isSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string };
  const message = record.message?.toLowerCase() ?? "";
  return (
    record.code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}
