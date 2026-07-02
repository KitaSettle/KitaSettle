import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

export interface MigrationApplyResult {
  applied: string[];
  connectionUsed: boolean;
}

function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    undefined
  );
}

export async function applyAllMigrations(): Promise<MigrationApplyResult> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Database connection URL is missing. Link Supabase to Vercel or set POSTGRES_URL_NON_POOLING.",
    );
  }

  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const applied: string[] = [];

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      await client.query(sql);
      applied.push(file);
    }
  } finally {
    await client.end();
  }

  return { applied, connectionUsed: true };
}

export async function backfillExistingAuthUsers(): Promise<number> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) return 0;

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const result = await client.query(`
      select id, email, raw_user_meta_data
      from auth.users
      order by created_at asc
    `);

    let count = 0;
    for (const row of result.rows as Array<{
      id: string;
      email: string | null;
      raw_user_meta_data: Record<string, unknown> | null;
    }>) {
      const meta = row.raw_user_meta_data ?? {};
      const name =
        (typeof meta.name === "string" && meta.name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        row.email?.split("@")[0] ||
        "Executive";

      await client.query(`select public.bootstrap_user_account($1, $2, $3)`, [
        row.id,
        row.email ?? "",
        name,
      ]);
      count += 1;
    }

    return count;
  } finally {
    await client.end();
  }
}
