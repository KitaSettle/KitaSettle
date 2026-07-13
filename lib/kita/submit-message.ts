import type { KitaChatMessage } from "@/lib/repositories/kita-chat-repository";

export interface TalkPayload {
  messages: KitaChatMessage[];
  curiosityQuestion: string | null;
}

const MAX_SUBMIT_ATTEMPTS = 3;

async function submitMessageWithRetry(message: string): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt < MAX_SUBMIT_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    lastResponse = await fetch("/api/kita/talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (lastResponse.ok) return lastResponse;
    if (lastResponse.status === 401 || lastResponse.status === 403) break;
  }
  return lastResponse ?? new Response(null, { status: 500 });
}

export async function fetchKitaConversation(): Promise<TalkPayload> {
  const response = await fetch("/api/kita/talk");
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Could not open Talk to Kita");
  }
  return (await response.json()) as TalkPayload;
}

export async function sendKitaMessage(message: string): Promise<TalkPayload> {
  const response = await submitMessageWithRetry(message);
  const payload = (await response.json()) as TalkPayload & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Kita couldn't reply just now. Please try again.");
  }
  return payload;
}
