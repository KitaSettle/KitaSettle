"use client";

import { isSupabaseConfigured } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/client";
import * as mockAuth from "./mock-client";

async function useSupabaseAuth<T>(
  supabaseFn: () => Promise<T>,
  mockFn: () => Promise<T>,
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return mockFn();
  }
  return supabaseFn();
}

export async function getSession() {
  return useSupabaseAuth(
    async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    mockAuth.getSession,
  );
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
  return useSupabaseAuth(
    async () => {
      const supabase = createClient();
      return supabase.auth.signInWithPassword({ email, password });
    },
    () => mockAuth.signInWithEmail(email, password),
  );
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  return useSupabaseAuth(
    async () => {
      const supabase = createClient();
      return supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name ?? email.split("@")[0] },
        },
      });
    },
    () => mockAuth.signUpWithEmail(email, password),
  );
}

export async function signInWithOAuth(provider: "google" | "github") {
  return useSupabaseAuth(
    async () => {
      const supabase = createClient();
      return supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
    },
    () => mockAuth.signInWithOAuth(provider),
  );
}

export async function signOut() {
  return useSupabaseAuth(
    async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    },
    mockAuth.signOut,
  );
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
