import { isOpenAIConfigured } from "@/lib/config/env";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { prepareAiUserContent } from "@/lib/security/sanitize";

export async function generateDocumentSummary(name: string, mimeType?: string | null): Promise<string> {
  if (!isOpenAIConfigured()) {
    return `${name} indexed for executive review.`;
  }

  const client = getOpenAIClient();
  const { content } = prepareAiUserContent(
    "document",
    JSON.stringify({ name, mimeType }),
  );
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "Write one concise executive summary sentence for an indexed document.",
      },
      {
        role: "user",
        content,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || `${name} indexed for executive review.`;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!isOpenAIConfigured()) return null;

  try {
    const client = getOpenAIClient();
    const { content } = prepareAiUserContent("embedding", text);
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: content.slice(0, 8000),
    });

    return response.data[0]?.embedding ?? null;
  } catch (error) {
    console.error("[KitaSettle] Embedding generation failed, continuing without vector:", error);
    return null;
  }
}
