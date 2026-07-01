"use client";

import { MOCK_AUTH_COOKIE } from "./constants";

const SESSION_KEY = "kitasettle-mock-session";

type MockSession = {
  email: string;
  name: string;
};

function readSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
}

function persistSession(session: MockSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `${MOCK_AUTH_COOKIE}=1; path=/; max-age=604800; SameSite=Lax`;
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  document.cookie = `${MOCK_AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export async function getSession() {
  return readSession();
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean(readSession());
}

export async function signInWithEmail(email: string, _password: string) {
  persistSession({
    email,
    name: email.split("@")[0] || "Executive",
  });
  return { data: { session: { user: { email } } }, error: null };
}

export async function signUpWithEmail(email: string, password: string) {
  return signInWithEmail(email, password);
}

export async function signInWithOAuth(_provider: "google" | "github") {
  return {
    data: null,
    error: { message: "OAuth requires Supabase configuration. See SUPABASE_SETUP.md." },
  };
}

export async function signOut() {
  clearSession();
}

export function onAuthStateChange(callback: (authenticated: boolean) => void) {
  void isAuthenticated().then(callback);
  return () => undefined;
}
