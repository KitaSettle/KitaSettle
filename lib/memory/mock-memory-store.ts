import type { MemoryItem } from "@/lib/types/memory";

export const mockMemoryItems: MemoryItem[] = [
  {
    id: "mem-1",
    title: "Steelworks proposal scope confirmed",
    description:
      "Approved direction: focus on structural scope, phased delivery, and photo documentation for client review.",
    createdAt: "2026-06-28T09:00:00.000Z",
    category: "Decisions",
    importance: "High",
    relatedKnowledge: ["know-4", "know-6"],
    status: "active",
  },
  {
    id: "mem-2",
    title: "CBTA lesson improvement note",
    description:
      "Add stronger scenario discussion and evidence capture for competency assessment in tomorrow's session.",
    createdAt: "2026-06-27T14:30:00.000Z",
    category: "Training",
    importance: "High",
    relatedKnowledge: ["know-2", "know-3"],
    status: "active",
  },
  {
    id: "mem-3",
    title: "Aviation module concept captured",
    description:
      "Modular CBTA package for regional operators — partner with training centre, recurring revenue model.",
    createdAt: "2026-06-25T11:00:00.000Z",
    category: "Ideas",
    importance: "Medium",
    relatedKnowledge: ["know-1", "know-2"],
    status: "active",
  },
  {
    id: "mem-4",
    title: "Pricing assumptions flagged for review",
    description:
      "Margin sensitivity on steelworks Phase 2 — confirm before sending final proposal.",
    createdAt: "2026-06-24T16:00:00.000Z",
    category: "Finance",
    importance: "High",
    relatedKnowledge: ["know-6"],
    status: "pending",
  },
];
