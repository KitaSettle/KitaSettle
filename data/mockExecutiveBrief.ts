import type { ExecutiveBrief } from "@/lib/types";

export const mockExecutiveBrief: ExecutiveBrief = {
  summary:
    "Today centres on two high-impact deliverables: the steelworks proposal and tomorrow's aviation training session. Both need your review before end of day. Everything else can wait.",
  confidenceScore: 87,
  recommendedFocus:
    "Finalise the steelworks proposal and prepare tomorrow's aviation training session.",
  priorities: [
    {
      id: "p1",
      title: "Review steelworks proposal",
      description: "Draft is prepared — confirm scope, pricing, and project photos.",
    },
    {
      id: "p2",
      title: "Prepare CBTA lesson",
      description: "Training slides need stronger scenario discussion for tomorrow.",
    },
    {
      id: "p3",
      title: "Capture one business idea for review",
      description: "Quick note on the aviation module concept — 15 minutes.",
    },
  ],
  decisions: [
    {
      id: "d1",
      title: "Approve proposal direction",
      status: "needs-approval",
    },
    {
      id: "d2",
      title: "Confirm pricing assumptions",
      status: "needs-approval",
    },
  ],
  risks: [
    {
      id: "r1",
      title: "Proposal lacks project photos",
    },
    {
      id: "r2",
      title: "Training slides need stronger scenario discussion",
    },
  ],
  opportunities: [
    {
      id: "o1",
      title: "Turn aviation lesson framework into reusable product module",
    },
  ],
  aiPrepared: [
    {
      id: "a1",
      title: "Steelworks proposal draft",
      description: "Scope, pricing table, and executive summary prepared for your review.",
    },
    {
      id: "a2",
      title: "CBTA lesson outline",
      description: "Session structure and learning objectives mapped — slides need your input.",
    },
    {
      id: "a3",
      title: "Weekly priority scan",
      description: "Cross-checked calendar and open items to surface today's focus areas.",
    },
  ],
  workloadEstimate: "4.5 hours",
};
