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

export function getDiscoverySubmitErrorMessage(): string {
  return "Kita didn't receive that answer. Please try again.";
}
