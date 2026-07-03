import type { AuthError } from "@supabase/supabase-js";

export type AccountHint = {
  exists: boolean | null;
  hasEmailPassword: boolean;
  oauthProviders: string[];
};

type AuthLikeError = Pick<AuthError, "message"> | null | undefined;

function normalizeMessage(error: AuthLikeError): string {
  return error?.message?.trim() ?? "";
}

function formatOAuthProviders(providers: string[]): string {
  const labels = providers.map((provider) => {
    if (provider === "google") return "Google";
    if (provider === "github") return "GitHub";
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  });

  if (labels.length === 0) return "Google or GitHub";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}`;
}

function humanizeAuthMessage(rawMessage: string, fallback: string): string {
  const message = rawMessage.trim();
  if (!message) return fallback;

  if (message.length <= 180 && !message.includes("{") && !message.includes("stack")) {
    return message.endsWith(".") ? message : `${message}.`;
  }

  return fallback;
}

export function getLoginErrorMessage(
  signInError: AuthLikeError,
  accountHint?: AccountHint | null,
): string {
  const message = normalizeMessage(signInError).toLowerCase();

  if (message.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  if (accountHint?.exists && !accountHint.hasEmailPassword && accountHint.oauthProviders.length > 0) {
    return `This account uses ${formatOAuthProviders(accountHint.oauthProviders)}. Please sign in with one of those options.`;
  }

  if (accountHint?.exists === false) {
    return "No account found with that email. Create an account to get started.";
  }

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    message.includes("wrong password")
  ) {
    return "Incorrect email or password. Please try again.";
  }

  if (message.includes("user not found")) {
    return "No account found with that email. Create an account to get started.";
  }

  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("rate") || message.includes("too many")) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }

  if (message.includes("fetch failed") || message.includes("network") || message.includes("failed to fetch")) {
    return "Network error while signing in. Check your connection and try again.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "Sign-up is disabled. Contact support for access.";
  }

  return humanizeAuthMessage(
    normalizeMessage(signInError),
    "We couldn't sign you in. Please check your email and password, then try again.",
  );
}

export function getSignUpErrorMessage(error: AuthLikeError): string {
  const rawMessage = normalizeMessage(error);
  const message = rawMessage.toLowerCase();

  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already registered")
  ) {
    return "An account with this email already exists. Sign in or reset your password.";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "Sign-up is disabled. Contact support for access.";
  }

  if (message.includes("password") || message.includes("weak") || message.includes("at least")) {
    return "Your password must be at least 6 characters.";
  }

  if (message.includes("invalid email") || message.includes("email address invalid")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("rate") || message.includes("too many")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("authretryablefetcherror")
  ) {
    return "Network error while creating your account. Check your connection and try again.";
  }

  if (message.includes("database error saving new user")) {
    return "We couldn't finish setting up your account after sign-up. Our team has been notified — please try again in a moment.";
  }

  if (message.includes("forbidden")) {
    return "Account setup failed during sign-up. Please try again in a moment or contact support.";
  }

  if (message.includes("redirect") && message.includes("not allowed")) {
    return "Email confirmation is misconfigured. Contact support so we can fix the redirect URL.";
  }

  if (message.includes("smtp") || message.includes("email provider")) {
    return "We couldn't send the confirmation email. Try again shortly or contact support.";
  }

  if (message.includes("hook") || message.includes("trigger")) {
    return "Account setup failed on our side. Please try again or contact support.";
  }

  if (message.includes("503") || message.includes("502") || message.includes("504") || message.includes("unavailable")) {
    return "Authentication service is temporarily unavailable. Please try again shortly.";
  }

  return humanizeAuthMessage(rawMessage, "We couldn't create your account. Please try again.");
}

export function getOAuthErrorMessage(error: AuthLikeError, provider: "google" | "github"): string {
  const message = normalizeMessage(error);
  const label = provider === "google" ? "Google" : "GitHub";

  if (message.includes("popup") || message.includes("closed")) {
    return `${label} sign-in was cancelled. Please try again when you're ready.`;
  }

  if (message.includes("network") || message.includes("fetch")) {
    return `We couldn't reach ${label}. Check your connection and try again.`;
  }

  if (message.includes("oauth") || message.includes("provider")) {
    return `${label} sign-in isn't available right now. Try email sign-in or contact support.`;
  }

  return humanizeAuthMessage(message, `${label} sign-in was interrupted. Please try again.`);
}

export function getPasswordResetErrorMessage(error: AuthLikeError): string {
  const message = normalizeMessage(error).toLowerCase();

  if (message.includes("same password")) {
    return "Choose a different password from your current one.";
  }

  if (message.includes("weak") || message.includes("at least")) {
    return "Your password must be at least 6 characters.";
  }

  if (message.includes("session") || message.includes("jwt") || message.includes("expired")) {
    return "This reset link has expired. Please request a new one.";
  }

  if (message.includes("fetch failed") || message.includes("network")) {
    return "Network error while updating your password. Check your connection and try again.";
  }

  return humanizeAuthMessage(
    normalizeMessage(error),
    "We couldn't update your password. Please try again.",
  );
}

export function getForgotPasswordErrorMessage(error: AuthLikeError): string {
  const message = normalizeMessage(error).toLowerCase();

  if (message.includes("rate") || message.includes("too many")) {
    return "Too many reset requests. Please wait a few minutes and try again.";
  }

  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("fetch failed") || message.includes("network")) {
    return "Network error while sending the reset email. Check your connection and try again.";
  }

  if (message.includes("redirect") && message.includes("not allowed")) {
    return "Password reset is misconfigured. Contact support so we can fix the redirect URL.";
  }

  return humanizeAuthMessage(
    normalizeMessage(error),
    "We couldn't send a reset email. Please check the address and try again.",
  );
}

export function getSignOutErrorMessage(): string {
  return "We couldn't sign you out. Please try again.";
}
