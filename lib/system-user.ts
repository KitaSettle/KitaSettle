/**
 * System user ID for server-side scripts and background jobs.
 * Set SUPABASE_SYSTEM_USER_ID to a valid auth.users UUID after first signup.
 */
export async function getSystemUserId(): Promise<string> {
  const userId = process.env.SUPABASE_SYSTEM_USER_ID?.trim();
  if (userId) return userId;
  throw new Error(
    "SUPABASE_SYSTEM_USER_ID is not set. Sign up once, then set this env var to your user UUID.",
  );
}
