export type PublicRuntimeEnv = {
  appName: string;
  appEnv: string;
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

declare global {
  interface Window {
    __KITASETTLE_PUBLIC_ENV__?: PublicRuntimeEnv;
  }
}

function readDirectPublic(
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function resolvePublicEnv(): PublicRuntimeEnv {
  if (typeof window !== "undefined" && window.__KITASETTLE_PUBLIC_ENV__) {
    return window.__KITASETTLE_PUBLIC_ENV__;
  }

  return {
    appName: readDirectPublic(process.env.NEXT_PUBLIC_APP_NAME, "KitaSettle Alpha"),
    appEnv: readDirectPublic(process.env.NEXT_PUBLIC_APP_ENV, "alpha"),
    appUrl: readDirectPublic(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
    supabaseUrl: readDirectPublic(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "https://placeholder.supabase.co",
    ),
    supabaseAnonKey: readDirectPublic(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "placeholder-anon-key",
    ),
  };
}

export function getSupabaseBrowserConfig(): Pick<PublicRuntimeEnv, "supabaseUrl" | "supabaseAnonKey"> {
  const config = resolvePublicEnv();
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
  };
}
