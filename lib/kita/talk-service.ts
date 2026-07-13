import type { Repositories } from "@/lib/repositories";
import type { KitaChatMessage } from "@/lib/repositories/kita-chat-repository";
import { createHardenedChatCompletion } from "@/lib/ai/hardened-chat";
import { getCuriosityQuestion } from "@/lib/kita/curiosity-engine";
import { createExecutiveDNAEngine } from "@/lib/executive-dna";

export interface TalkToKitaPayload {
  messages: KitaChatMessage[];
  curiosityQuestion: string | null;
}

const KITA_GREETING =
  "Hi, I'm Kita. Ask me anything — priorities, documents, decisions, or what deserves your attention today. I'm here to help you think clearly.";

export class TalkToKitaService {
  constructor(private repos: Repositories) {}

  async loadConversation(userId: string): Promise<TalkToKitaPayload> {
    const [messages, profile] = await Promise.all([
      this.repos.kitaChat.listMessages(userId),
      this.repos.executiveDna.ensureProfile(userId),
    ]);

    if (messages.length === 0) {
      const greeting = await this.repos.kitaChat.appendMessage(userId, {
        role: "assistant",
        content: KITA_GREETING,
      });
      return {
        messages: [greeting],
        curiosityQuestion: getCuriosityQuestion(profile),
      };
    }

    return {
      messages,
      curiosityQuestion: getCuriosityQuestion(profile),
    };
  }

  async sendMessage(userId: string, content: string): Promise<TalkToKitaPayload> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error("Message cannot be empty.");

    await this.repos.kitaChat.appendMessage(userId, {
      role: "user",
      content: trimmed,
    });

    try {
      const dnaEngine = createExecutiveDNAEngine(this.repos);
      await dnaEngine.learningService.observeConversation(userId, trimmed);
    } catch (error) {
      console.error("[KitaSettle] Talk to Kita learning observation failed:", error);
    }

    const [history, profile] = await Promise.all([
      this.repos.kitaChat.listMessages(userId, 20),
      this.repos.executiveDna.ensureProfile(userId),
    ]);

    const context = history
      .slice(-12)
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const profession = profile.profile.profession || profile.profile.role || "executive";
    const fallback =
      "I'm here with you. I saved what you shared — tell me a little more about what you'd like help with today.";

    const ai = await createHardenedChatCompletion({
      source: "talk-to-kita",
      systemPrompt: [
        "You are Kita, a warm executive companion inside KitaSettle.",
        `The user is a ${profession}.`,
        "Respond in plain, human language. Be concise, calm, and helpful.",
        "Never mention APIs, databases, models, or technical systems.",
        "If you don't know something, say so honestly and suggest a next step.",
      ].join(" "),
      userPrompt: `Recent conversation:\n${context}\n\nReply to the user's latest message.`,
      fallback,
    });

    await this.repos.kitaChat.appendMessage(userId, {
      role: "assistant",
      content: ai.content,
    });

    const updatedProfile = await this.repos.executiveDna.ensureProfile(userId);
    const curiosityQuestion = getCuriosityQuestion(updatedProfile);
    const messages = await this.repos.kitaChat.listMessages(userId);

    return {
      messages,
      curiosityQuestion,
    };
  }
}

export function createTalkToKitaService(repos: Repositories): TalkToKitaService {
  return new TalkToKitaService(repos);
}
