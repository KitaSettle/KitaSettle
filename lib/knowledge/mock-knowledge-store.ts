import type { KnowledgeItem } from "@/lib/types/knowledge";

export const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: "know-1",
    title: "ICAO RVSM monitoring requirements — Asia-Pacific ops update",
    summary:
      "Revised RVSM monitoring group guidance adjusts height-keeping performance thresholds for Asia-Pacific routes.",
    content:
      "The ICAO Asia-Pacific RVSM monitoring group has published updated height-keeping performance thresholds effective Q3. Operators must review training scenarios and briefing packs to reflect revised monitoring criteria and reporting intervals.",
    source: "ICAO",
    url: "https://www.icao.int/safety/airnavigation/Pages/default.aspx",
    category: "Aviation Regulations",
    subcategory: "RVSM",
    confidence: 93,
    publishedDate: "2026-06-28T08:00:00.000Z",
    lastReviewed: "2026-07-01T09:00:00.000Z",
    relatedItems: ["know-2", "know-3"],
    tags: ["RVSM", "ICAO", "CBTA"],
    importance: "High",
  },
  {
    id: "know-2",
    title: "FAA CBTA advisory circular — evidence and instructor standards",
    summary:
      "Updated circular clarifies competency evidence capture and assessor qualifications for CBTA programmes.",
    content:
      "FAA AC updates define minimum evidence standards for CBTA programmes, instructor assessor qualifications, and documentation retention. Training centres should align lesson plans and audit binders before the next compliance review.",
    source: "FAA",
    url: "https://www.faa.gov/regulations_policies/advisory_circulars/",
    category: "Training & CBTA",
    subcategory: "Competency Assessment",
    confidence: 91,
    publishedDate: "2026-06-27T10:30:00.000Z",
    lastReviewed: "2026-07-01T08:30:00.000Z",
    relatedItems: ["know-1", "know-3"],
    tags: ["CBTA", "FAA"],
    importance: "High",
  },
  {
    id: "know-3",
    title: "CAAM recurrent training compliance and logging windows",
    summary:
      "New CAAM guidance tightens recurrent check documentation and simulator session record retention.",
    content:
      "CAAM circular updates specify recurrent training compliance windows, simulator log retention periods, and audit documentation requirements for Malaysia-based operators and training organisations.",
    source: "CAAM",
    url: "https://www.caam.gov.my/",
    category: "Aviation Regulations",
    subcategory: "Recurrent Training",
    confidence: 86,
    publishedDate: "2026-06-26T07:15:00.000Z",
    lastReviewed: "2026-06-30T16:00:00.000Z",
    relatedItems: ["know-2"],
    tags: ["CAAM", "CBTA"],
    importance: "Medium",
  },
  {
    id: "know-4",
    title: "Steelworks proposal — CIDB compliance and scope validation",
    summary:
      "Prepared review confirms structural scope, phased delivery milestones, and CIDB registration alignment.",
    content:
      "Proposal review validates structural scope, phased delivery milestones, CIDB registration alignment, and photo documentation requirements. Pricing assumptions for Phase 2 remain flagged for executive review.",
    source: "CIDB",
    url: "https://www.cidb.gov.my/",
    category: "Construction & Projects",
    subcategory: "Proposals",
    confidence: 88,
    publishedDate: "2026-06-25T12:00:00.000Z",
    lastReviewed: "2026-06-30T11:00:00.000Z",
    relatedItems: ["know-5"],
    tags: ["Proposal", "Steelworks"],
    importance: "High",
  },
  {
    id: "know-5",
    title: "Executive decision quality under operational pressure",
    summary:
      "Leadership brief outlines decision frameworks for founders balancing multiple high-stakes deliverables.",
    content:
      "Framework for prioritising aviation training, client proposals, and strategic initiatives without cognitive overload. Emphasises decision confidence, focus protection, and knowledge preservation.",
    source: "Harvard Business Review",
    url: "https://hbr.org/",
    category: "Leadership & Decisions",
    subcategory: "Decision Making",
    confidence: 79,
    publishedDate: "2026-06-24T09:00:00.000Z",
    lastReviewed: "2026-06-29T14:00:00.000Z",
    relatedItems: [],
    tags: ["Leadership"],
    importance: "Medium",
  },
  {
    id: "know-6",
    title: "Steelworks Phase 2 pricing sensitivity analysis",
    summary:
      "Margin sensitivity on steelworks Phase 2 requires confirmation before final client submission.",
    content:
      "Financial review highlights margin sensitivity on Phase 2 scope. Recommend executive sign-off on pricing assumptions and contingency before proposal dispatch.",
    source: "Internal",
    url: "https://kitasettle.local/knowledge/know-6",
    category: "Finance",
    subcategory: "Pricing",
    confidence: 82,
    publishedDate: "2026-06-24T08:00:00.000Z",
    lastReviewed: "2026-06-28T10:00:00.000Z",
    relatedItems: ["know-4"],
    tags: ["Finance", "Proposal", "Steelworks"],
    importance: "High",
  },
];
