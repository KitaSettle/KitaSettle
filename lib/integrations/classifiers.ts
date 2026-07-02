import type { EmailClassification } from "@/lib/types/executive-connect";

const RULES: Array<{ classification: EmailClassification; patterns: RegExp[] }> = [
  { classification: "urgent", patterns: [/urgent/i, /immediate action/i, /asap/i] },
  { classification: "waiting", patterns: [/waiting/i, /pending your/i, /follow up/i] },
  { classification: "approvals", patterns: [/approval/i, /approve/i, /sign off/i, /review and confirm/i] },
  { classification: "travel", patterns: [/flight/i, /itinerary/i, /hotel/i, /boarding/i] },
  { classification: "finance", patterns: [/invoice/i, /payment/i, /finance/i, /budget/i] },
  { classification: "meetings", patterns: [/meeting invite/i, /invitation:/i, /calendar/i] },
];

export function classifyEmail(input: {
  subject: string;
  sender: string;
  snippet?: string | null;
  labels?: string[];
}): EmailClassification {
  const haystack = `${input.subject} ${input.sender} ${input.snippet ?? ""}`;
  if (input.labels?.includes("IMPORTANT")) return "urgent";

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.classification;
    }
  }

  if (/newsletter|digest|notification/i.test(haystack)) return "fyi";
  return "fyi";
}

export function inferCalendarCategory(input: {
  title: string;
  description?: string | null;
  location?: string | null;
  eventType?: string | null;
}): "meeting" | "event" | "birthday" | "travel" | "reminder" {
  const haystack = `${input.title} ${input.description ?? ""} ${input.location ?? ""}`.toLowerCase();
  if (/birthday/i.test(haystack) || input.eventType === "birthday") return "birthday";
  if (/flight|travel|airport|hotel|itinerary|jnb|lhr|jfk/i.test(haystack)) return "travel";
  if (/deadline|due|reminder|submit/i.test(haystack)) return "reminder";
  if (/meeting|review|call|standup|board|1:1|sync/i.test(haystack)) return "meeting";
  return "event";
}
