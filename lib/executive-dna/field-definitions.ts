import type { ExecutivePersonalizationHints } from "@/lib/types/executive-dna";

export const PROFESSION_TEMPLATES: Record<string, ExecutivePersonalizationHints> = {
  pilot: {
    professionLabel: "Aviation Executive",
    priorityFocus: "Safety, compliance, and operational readiness",
    briefTone: "Precise and regulation-aware",
    emphasisAreas: ["RVSM", "CBTA", "Regulatory updates", "Crew training"],
  },
  "construction director": {
    professionLabel: "Construction Director",
    priorityFocus: "Project delivery, compliance, and client approvals",
    briefTone: "Direct and milestone-focused",
    emphasisAreas: ["CIDB", "Proposals", "Site risk", "Budget control"],
  },
  lawyer: {
    professionLabel: "Legal Executive",
    priorityFocus: "Risk exposure, deadlines, and client matters",
    briefTone: "Structured and evidence-led",
    emphasisAreas: ["Compliance", "Case priorities", "Regulatory change"],
  },
  doctor: {
    professionLabel: "Medical Executive",
    priorityFocus: "Patient outcomes, staffing, and clinical governance",
    briefTone: "Calm and prioritised",
    emphasisAreas: ["Clinical risk", "Staffing", "Policy updates"],
  },
  ceo: {
    professionLabel: "Chief Executive",
    priorityFocus: "Strategic bets, capital allocation, and leadership cadence",
    briefTone: "Board-ready and concise",
    emphasisAreas: ["Strategy", "People", "Finance", "Growth"],
  },
  engineer: {
    professionLabel: "Engineering Leader",
    priorityFocus: "Technical delivery, quality, and cross-team alignment",
    briefTone: "Analytical and action-oriented",
    emphasisAreas: ["Design decisions", "Technical debt", "Delivery"],
  },
  teacher: {
    professionLabel: "Education Leader",
    priorityFocus: "Curriculum, learner outcomes, and stakeholder communication",
    briefTone: "Supportive and structured",
    emphasisAreas: ["Lesson planning", "Assessment", "Training quality"],
  },
  politician: {
    professionLabel: "Public Leader",
    priorityFocus: "Stakeholder sentiment, policy timing, and public narrative",
    briefTone: "Balanced and context-rich",
    emphasisAreas: ["Policy", "Public messaging", "Stakeholder risk"],
  },
  "business owner": {
    professionLabel: "Business Owner",
    priorityFocus: "Cash flow, sales pipeline, and operator priorities",
    briefTone: "Practical and revenue-aware",
    emphasisAreas: ["Sales", "Operations", "Hiring", "Customer delivery"],
  },
  consultant: {
    professionLabel: "Consultant",
    priorityFocus: "Client delivery, proposals, and insight packaging",
    briefTone: "Insight-led and client-centric",
    emphasisAreas: ["Proposals", "Client work", "Thought leadership"],
  },
};

export const DEFAULT_PERSONALIZATION: ExecutivePersonalizationHints = {
  professionLabel: "Executive",
  priorityFocus: "High-impact decisions and strategic delivery",
  briefTone: "Clear and executive-ready",
  emphasisAreas: ["Priorities", "Risks", "Opportunities"],
};

export function resolveProfessionTemplate(profession: string): ExecutivePersonalizationHints {
  const key = profession.trim().toLowerCase();
  if (!key) return DEFAULT_PERSONALIZATION;

  if (PROFESSION_TEMPLATES[key]) return PROFESSION_TEMPLATES[key];

  for (const [templateKey, template] of Object.entries(PROFESSION_TEMPLATES)) {
    if (key.includes(templateKey) || templateKey.includes(key)) {
      return template;
    }
  }

  if (key.includes("pilot") || key.includes("aviation")) return PROFESSION_TEMPLATES.pilot;
  if (key.includes("construct")) return PROFESSION_TEMPLATES["construction director"];
  if (key.includes("legal") || key.includes("lawyer")) return PROFESSION_TEMPLATES.lawyer;
  if (key.includes("doctor") || key.includes("medical")) return PROFESSION_TEMPLATES.doctor;
  if (key.includes("ceo") || key.includes("founder")) return PROFESSION_TEMPLATES.ceo;

  return DEFAULT_PERSONALIZATION;
}
