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

export const STATIC_KNOWLEDGE_CATEGORIES = [
  {
    id: "cat-1",
    name: "Aviation Regulations",
    description: "CAAM, FAA, EASA, and ICAO standards in one view.",
    searchTags: ["ICAO", "CAAM", "RVSM", "CBTA"],
  },
  {
    id: "cat-2",
    name: "Training & CBTA",
    description: "Lesson plans, competency frameworks, and session notes.",
    searchTags: ["CBTA", "CAAM"],
  },
  {
    id: "cat-3",
    name: "Business Strategy",
    description: "Market signals, proposals, and growth decisions.",
    searchTags: ["Proposal", "Leadership"],
  },
  {
    id: "cat-4",
    name: "Construction & Projects",
    description: "Steelworks proposals, CIDB compliance, and project files.",
    searchTags: ["Steelworks", "Proposal"],
  },
  {
    id: "cat-5",
    name: "Leadership & Decisions",
    description: "Executive notes, approvals, and decision history.",
    searchTags: ["Leadership", "Finance"],
  },
] as const;

export const STATIC_TRUSTED_SOURCES = [
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
] as const;
