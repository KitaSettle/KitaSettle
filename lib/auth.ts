const AUTH_KEY = "kitasettle-auth";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function login(): void {
  sessionStorage.setItem(AUTH_KEY, "true");
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY);
}
