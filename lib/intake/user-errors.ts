export function getIntakeErrorMessage(raw: string | undefined): string {
  const message = raw?.toLowerCase() ?? "";

  if (message.includes("unauthorized") || message.includes("401")) {
    return "Please sign in again, then share this with Kita.";
  }

  if (message.includes("too many") || message.includes("rate")) {
    return "You're sharing quickly — please wait a moment and try again.";
  }

  if (message.includes("provide a file") || message.includes("file, url, or text")) {
    return "Share a file, link, or some text for Kita to work with.";
  }

  if (message.includes("404") || message.includes("could not fetch url") || message.includes("fetch url")) {
    return "That link couldn't be opened. Check the URL and try again.";
  }

  if (message.includes("file too large") || message.includes("size")) {
    return "That file is too large. Try a smaller file or paste the key points instead.";
  }

  if (message.includes("unsupported") || message.includes("invalid type")) {
    return "Kita couldn't read that file type. Try PDF, Word, text, or paste the content instead.";
  }

  if (message.includes("invalid json")) {
    return "Something went wrong sending that to Kita. Please try again.";
  }

  if (message.includes("delegation failed")) {
    return "Kita couldn't process that just now. Please try again.";
  }

  return "Kita couldn't process that just now. Please try again.";
}

export function getIntakeSuccessToast(needsClarification: boolean | undefined): string {
  if (needsClarification) {
    return "Saved — Kita may need a little more detail from you.";
  }

  return "Added to your Executive Brain";
}
