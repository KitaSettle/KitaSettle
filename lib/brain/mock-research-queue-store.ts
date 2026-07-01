import type { ResearchQueueRecord } from "@/lib/types/research";

export const mockResearchQueue: ResearchQueueRecord[] = [
  {
    id: "rq-1",
    title: "ICAO RVSM monitoring requirements — Asia-Pacific ops update",
    summary:
      "Revised RVSM monitoring group guidance adjusts height-keeping performance thresholds for Asia-Pacific routes through Q3.",
    source: "ICAO",
    sourceUrl: "https://www.icao.int/safety/airnavigation/Pages/default.aspx",
    confidence: 93,
    importance: "High",
    whyItMatters:
      "Affects recurrent training scenarios and briefing content for regional operator clients this month.",
    status: "Ready",
    tags: ["RVSM", "ICAO"],
    queuedAt: "2026-07-01T06:00:00.000Z",
    updatedAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "rq-2",
    title: "FAA CBTA advisory circular — evidence and instructor standards",
    summary:
      "Updated circular clarifies competency evidence capture, assessor qualifications, and CBTA programme documentation.",
    source: "FAA",
    sourceUrl: "https://www.faa.gov/regulations_policies/advisory_circulars/",
    confidence: 91,
    importance: "High",
    whyItMatters:
      "Directly shapes tomorrow's CBTA lesson structure and your training centre audit readiness.",
    status: "Ready",
    tags: ["CBTA"],
    queuedAt: "2026-07-01T05:30:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "rq-3",
    title: "CAAM circular — recurrent training compliance and logging windows",
    summary:
      "New CAAM guidance tightens recurrent check documentation and simulator session record retention periods.",
    source: "CAAM",
    sourceUrl: "https://www.caam.gov.my/",
    confidence: 86,
    importance: "Medium",
    whyItMatters:
      "Keeps your Malaysia-based training operations aligned before the next CAAM regulatory review.",
    status: "Analysing",
    tags: ["CAAM", "CBTA"],
    queuedAt: "2026-06-30T18:00:00.000Z",
    updatedAt: "2026-07-01T07:15:00.000Z",
  },
  {
    id: "rq-4",
    title: "Steelworks proposal — CIDB compliance and scope validation",
    summary:
      "Prepared review confirms structural scope, phased delivery milestones, and CIDB registration alignment for the proposal.",
    source: "CIDB",
    sourceUrl: "https://www.cidb.gov.my/",
    confidence: 88,
    importance: "High",
    whyItMatters:
      "Client submission is due end of day — pricing and photo documentation still need your final approval.",
    status: "Ready",
    tags: ["Proposal", "Steelworks"],
    queuedAt: "2026-06-30T12:00:00.000Z",
    updatedAt: "2026-07-01T06:45:00.000Z",
  },
  {
    id: "rq-5",
    title: "HBR — executive decision quality under operational pressure",
    summary:
      "Leadership brief outlines decision frameworks for founders balancing multiple high-stakes deliverables weekly.",
    source: "Harvard Business Review",
    sourceUrl: "https://hbr.org/",
    confidence: 79,
    importance: "Medium",
    whyItMatters:
      "Supports how you prioritise aviation training, proposals, and strategic ideas without cognitive overload.",
    status: "Searching",
    tags: ["Leadership"],
    queuedAt: "2026-06-30T10:00:00.000Z",
    updatedAt: "2026-07-01T05:00:00.000Z",
  },
];
