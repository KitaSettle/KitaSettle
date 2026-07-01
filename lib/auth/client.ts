"use client";

import { isSupabaseConfigured } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/client";
import * as mockAuth from "./mock-client";

export async function getSession() {
  if (!isSupabaseConfigured()) {
    return mockAuth.getSession();
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function isAuthenticated(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return mockAuth.isAuthenticated();
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    return mockAuth.signInWithEmail(email, password);
  }

  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  if (!isSupabaseConfigured()) {
    return mockAuth.signUpWithEmail(email, password);
  }

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
  if (!isSupabaseConfigured()) {
    return mockAuth.signInWithOAuth(provider);
  }

  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    return mockAuth.signOut();
  }

  const supabase = createClient();
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback: (authenticated: boolean) => void) {
  if (!isSupabaseConfigured()) {
    return mockAuth.onAuthStateChange(callback);
  }

  const supabase = createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session));
  });
  return () => subscription.unsubscribe();
}
