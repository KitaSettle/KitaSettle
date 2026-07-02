import type { AuthError } from "@supabase/supabase-js";

export type AccountHint = {
  exists: boolean | null;
  hasEmailPassword: boolean;
  oauthProviders: string[];
};

type AuthLikeError = Pick<AuthError, "message"> | null | undefined;

function normalizeMessage(error: AuthLikeError): string {
  return error?.message?.toLowerCase() ?? "";
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

export function getLoginErrorMessage(
  signInError: AuthLikeError,
  accountHint?: AccountHint | null,
): string {
  const message = normalizeMessage(signInError);

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

  return "We couldn't sign you in. Please check your details and try again.";
}

export function getPasswordResetErrorMessage(error: AuthLikeError): string {
  const message = normalizeMessage(error);

  if (message.includes("same password")) {
    return "Choose a different password from your current one.";
  }

  if (message.includes("weak") || message.includes("at least")) {
    return "Your password must be at least 6 characters.";
  }

  if (message.includes("session") || message.includes("jwt")) {
    return "This reset link has expired. Please request a new one.";
  }

  return "We couldn't update your password. Please try again.";
}

export function getForgotPasswordErrorMessage(error: AuthLikeError): string {
  const message = normalizeMessage(error);

  if (message.includes("rate") || message.includes("too many")) {
    return "Too many reset requests. Please wait a few minutes and try again.";
  }

  return "We couldn't send a reset email. Please check the address and try again.";
}
