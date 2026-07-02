import { applyAllMigrations, backfillExistingAuthUsers } from "@/lib/database/apply-migrations";
import { getSchemaHealthReport, type SchemaHealthReport } from "@/lib/database/schema-health";

let schemaApplyPromise: Promise<SchemaHealthReport> | null = null;

export async function ensureSchemaReady(): Promise<SchemaHealthReport> {
  const initial = await getSchemaHealthReport();
  if (initial.ready) return initial;

  const databaseUrl =
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    console.error("[KitaSettle] Schema missing and no database URL available for auto-apply.");
    return initial;
  }

  if (!schemaApplyPromise) {
    schemaApplyPromise = (async () => {
      console.info("[KitaSettle] Auto-applying missing database schema...");
      await applyAllMigrations();
      await backfillExistingAuthUsers();
      return getSchemaHealthReport();
    })().finally(() => {
      schemaApplyPromise = null;
    });
  }

  return schemaApplyPromise;
}
