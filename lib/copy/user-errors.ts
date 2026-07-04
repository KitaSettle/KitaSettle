export function getExecutiveLoadErrorMessage(raw: string | undefined): string {
  const message = raw?.toLowerCase() ?? "";

  if (message.includes("unauthorized") || message.includes("401")) {
    return "Your session expired. Please sign in again.";
  }

  if (message.includes("user profile")) {
    return "We couldn't load your profile. Please refresh or sign in again.";
  }

  if (message.includes("brief") || message.includes("executive")) {
    return "We couldn't prepare your morning brief right now. Please try again in a moment.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "We couldn't reach Kita. Check your connection and try again.";
  }

  return "We couldn't load your dashboard right now. Please try again.";
}

export function getDiscoveryLoadErrorMessage(): string {
  return "We couldn't start your getting-to-know-you conversation. Please try again.";
}

export function getDiscoverySubmitErrorMessage(apiError?: string): string {
  if (process.env.NODE_ENV === "development" && apiError?.trim()) {
    return apiError.trim();
  }
  return "Kita didn't receive that answer. Please try again.";
}

export function resolveDiscoverySubmitError(
  response: Response,
  payload: { error?: string } | null,
): string {
  const apiError = payload?.error?.trim();
  if (process.env.NODE_ENV === "development" && apiError) {
    return `${apiError} (HTTP ${response.status})`;
  }
  if (response.status === 403) {
    return "Your session could not verify this request. Please refresh and try again.";
  }
  if (response.status === 429) {
    return "Kita is busy right now. Your answer was saved — please try again in a moment.";
  }
  return getDiscoverySubmitErrorMessage(apiError);
}
