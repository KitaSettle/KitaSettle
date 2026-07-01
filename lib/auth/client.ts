"use client";

import { createClient } from "@/lib/supabase/client";

export async function getSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session);
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name ?? email.split("@")[0] },
    },
  });
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback: (authenticated: boolean) => void) {
  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session));
  });
  return () => subscription.unsubscribe();
}
