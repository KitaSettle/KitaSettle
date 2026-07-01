import type { ExecutiveBrainData } from "@/lib/types";

export const mockExecutiveBrain: ExecutiveBrainData = {
  overview: {
    knowledgeItems: 842,
    executiveMemories: 173,
    skills: 48,
    trustedSources: 12,
    researchWaiting: 3,
    brainHealth: 92,
    estimatedTimeSavedHours: 14.5,
  },

  trustedSources: [
    {
      id: "ts-icao",
      name: "ICAO",
      category: "Aviation",
      description: "Global standards for civil aviation safety and training.",
      searchTags: ["ICAO", "RVSM", "CBTA"],
    },
    {
      id: "ts-caam",
      name: "CAAM",
      category: "Aviation",
      description: "Malaysia civil aviation regulations and circulars.",
      searchTags: ["CAAM", "CBTA"],
    },
    {
      id: "ts-faa",
      name: "FAA",
      category: "Aviation",
      description: "US aviation regulations, advisories, and guidance.",
      searchTags: ["CBTA", "RVSM"],
    },
    {
      id: "ts-easa",
      name: "EASA",
      category: "Aviation",
      description: "European aviation safety rules and compliance updates.",
      searchTags: ["RVSM", "CBTA"],
    },
    {
      id: "ts-boeing",
      name: "Boeing",
      category: "Aviation",
      description: "Technical bulletins, fleet updates, and industry insights.",
      searchTags: ["RVSM"],
    },
    {
      id: "ts-iata",
      name: "IATA",
      category: "Aviation",
      description: "Airline operations, training trends, and market signals.",
      searchTags: ["CBTA"],
    },
    {
      id: "ts-cidb",
      name: "CIDB",
      category: "Construction",
      description: "Malaysia construction standards and project compliance.",
      searchTags: ["Proposal", "Steelworks"],
    },
    {
      id: "ts-mcmc",
      name: "MCMC",
      category: "Regulatory",
      description: "Communications and digital policy affecting operations.",
      searchTags: [],
    },
    {
      id: "ts-hbr",
      name: "Harvard Business Review",
      category: "Leadership",
      description: "Executive decision-making and organisational strategy.",
      searchTags: ["Leadership"],
    },
    {
      id: "ts-mckinsey",
      name: "McKinsey",
      category: "Strategy",
      description: "Industry analysis and transformation frameworks.",
      searchTags: ["Leadership", "Finance"],
    },
  ],

  researchQueue: [
    {
      id: "rq-1",
      title: "ICAO RVSM monitoring requirements — Asia-Pacific ops update",
      source: "ICAO",
      confidence: 93,
      importance: "High",
      summary:
        "Revised RVSM monitoring group guidance adjusts height-keeping performance thresholds for Asia-Pacific routes through Q3.",
      whyItMatters:
        "Affects recurrent training scenarios and briefing content for regional operator clients this month.",
      sourceUrl: "https://www.icao.int/safety/airnavigation/Pages/default.aspx",
      searchTags: ["RVSM", "ICAO"],
    },
    {
      id: "rq-2",
      title: "FAA CBTA advisory circular — evidence and instructor standards",
      source: "FAA",
      confidence: 91,
      importance: "High",
      summary:
        "Updated circular clarifies competency evidence capture, assessor qualifications, and CBTA programme documentation.",
      whyItMatters:
        "Directly shapes tomorrow's CBTA lesson structure and your training centre audit readiness.",
      sourceUrl: "https://www.faa.gov/regulations_policies/advisory_circulars/",
      searchTags: ["CBTA"],
    },
    {
      id: "rq-3",
      title: "CAAM circular — recurrent training compliance and logging windows",
      source: "CAAM",
      confidence: 86,
      importance: "Medium",
      summary:
        "New CAAM guidance tightens recurrent check documentation and simulator session record retention periods.",
      whyItMatters:
        "Keeps your Malaysia-based training operations aligned before the next CAAM regulatory review.",
      sourceUrl: "https://www.caam.gov.my/",
      searchTags: ["CAAM", "CBTA"],
    },
    {
      id: "rq-4",
      title: "Steelworks proposal — CIDB compliance and scope validation",
      source: "CIDB",
      confidence: 88,
      importance: "High",
      summary:
        "Prepared review confirms structural scope, phased delivery milestones, and CIDB registration alignment for the proposal.",
      whyItMatters:
        "Client submission is due end of day — pricing and photo documentation still need your final approval.",
      sourceUrl: "https://www.cidb.gov.my/",
      searchTags: ["Proposal", "Steelworks"],
    },
    {
      id: "rq-5",
      title: "HBR — executive decision quality under operational pressure",
      source: "Harvard Business Review",
      confidence: 79,
      importance: "Medium",
      summary:
        "Leadership brief outlines decision frameworks for founders balancing multiple high-stakes deliverables weekly.",
      whyItMatters:
        "Supports how you prioritise aviation training, proposals, and strategic ideas without cognitive overload.",
      sourceUrl: "https://hbr.org/",
      searchTags: ["Leadership"],
    },
  ],

  categories: [
    {
      id: "cat-1",
      name: "Aviation Regulations",
      itemCount: 24,
      description: "CAAM, FAA, EASA, and ICAO standards in one view.",
      searchTags: ["ICAO", "CAAM", "RVSM", "CBTA"],
    },
    {
      id: "cat-2",
      name: "Training & CBTA",
      itemCount: 18,
      description: "Lesson plans, competency frameworks, and session notes.",
      searchTags: ["CBTA", "CAAM"],
    },
    {
      id: "cat-3",
      name: "Business Strategy",
      itemCount: 12,
      description: "Market signals, proposals, and growth decisions.",
      searchTags: ["Proposal", "Leadership"],
    },
    {
      id: "cat-4",
      name: "Construction & Projects",
      itemCount: 9,
      description: "Steelworks proposals, CIDB compliance, and project files.",
      searchTags: ["Steelworks", "Proposal"],
    },
    {
      id: "cat-5",
      name: "Leadership & Decisions",
      itemCount: 15,
      description: "Executive notes, approvals, and decision history.",
      searchTags: ["Leadership", "Finance"],
    },
  ],

  memory: [
    {
      id: "mem-1",
      title: "Steelworks proposal scope confirmed",
      snippet:
        "Approved direction: focus on structural scope, phased delivery, and photo documentation for client review.",
      date: "28 Jun 2026",
      category: "Decisions",
      searchTags: ["Steelworks", "Proposal"],
    },
    {
      id: "mem-2",
      title: "CBTA lesson improvement note",
      snippet:
        "Add stronger scenario discussion and evidence capture for competency assessment in tomorrow's session.",
      date: "27 Jun 2026",
      category: "Training",
      searchTags: ["CBTA"],
    },
    {
      id: "mem-3",
      title: "Aviation module concept captured",
      snippet:
        "Modular CBTA package for regional operators — partner with training centre, recurring revenue model.",
      date: "25 Jun 2026",
      category: "Ideas",
      searchTags: ["CBTA", "ICAO"],
    },
    {
      id: "mem-4",
      title: "Pricing assumptions flagged for review",
      snippet:
        "Margin sensitivity on steelworks Phase 2 — confirm before sending final proposal.",
      date: "24 Jun 2026",
      category: "Finance",
      searchTags: ["Finance", "Proposal", "Steelworks"],
    },
  ],

  skills: [
    {
      id: "skill-1",
      name: "Summarise regulatory updates",
      description: "Condense CAAM, FAA, and EASA changes into executive-ready briefs.",
      status: "active",
      searchTags: ["CAAM", "ICAO", "CBTA"],
    },
    {
      id: "skill-2",
      name: "Compare authority requirements",
      description: "Cross-reference CAAM vs EASA training and compliance differences.",
      status: "active",
      searchTags: ["CAAM", "CBTA"],
    },
    {
      id: "skill-3",
      name: "Draft executive briefs",
      description: "Prepare daily focus summaries from your knowledge and priorities.",
      status: "active",
      searchTags: ["Leadership"],
    },
    {
      id: "skill-4",
      name: "Analyse proposal risks",
      description: "Surface scope, pricing, and delivery risks before client submission.",
      status: "available",
      searchTags: ["Proposal", "Steelworks", "Finance"],
    },
    {
      id: "skill-5",
      name: "Track industry signals",
      description: "Monitor IATA, Boeing, and McKinsey for relevant market shifts.",
      status: "available",
      searchTags: ["RVSM"],
    },
  ],

  activity: [
    {
      id: "act-1",
      action: "Saved to memory",
      target: "CBTA lesson improvement note",
      timestamp: "Today, 09:14",
    },
    {
      id: "act-2",
      action: "Approved research",
      target: "EASA winter ops briefing",
      timestamp: "Yesterday, 16:42",
    },
    {
      id: "act-3",
      action: "Added trusted source",
      target: "Harvard Business Review",
      timestamp: "Yesterday, 11:08",
    },
    {
      id: "act-4",
      action: "Rejected research",
      target: "Generic HR compliance roundup",
      timestamp: "26 Jun, 14:30",
    },
  ],
};

export const BRAIN_SEARCH_KEYWORDS = [
  "RVSM",
  "CBTA",
  "ICAO",
  "CAAM",
  "Proposal",
  "Steelworks",
  "Leadership",
  "Finance",
] as const;
