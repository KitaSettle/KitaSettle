import { mockExecutiveBrief } from "@/data/mockExecutiveBrief";
import { mockExecutiveBrain } from "@/data/mockExecutiveBrain";
import { mockUser } from "@/data/mockUser";
import { mockKnowledgeItems } from "@/lib/knowledge/mock-knowledge-store";
import { mockMemoryItems } from "@/lib/memory/mock-memory-store";
import { mockResearchQueue } from "@/lib/brain/mock-research-queue-store";
import { skillRegistry } from "@/lib/skills/skill-registry";
import type { EntityId } from "@/lib/types/common";
import type { KnowledgeItem, KnowledgeSearchQuery } from "@/lib/types/knowledge";
import type { MemoryItem, MemorySearchQuery } from "@/lib/types/memory";
import type {
  ResearchQueueRecord,
  ResearchQueueStatus,
} from "@/lib/types/research";
import type { SkillDefinition } from "@/lib/types/skills";
import type { BrainActivityItem, ExecutiveBrief, User } from "@/lib/types/ui";
import type { AIExecutiveBriefOutput, ExecutiveBriefHistoryEntry } from "@/lib/ai/types";
import { matchesAnyField } from "@/lib/utils";
import type { Repositories } from "../index";
import {
  MockTrustedSourceRepository,
  type TrustedSourceRepository,
} from "../trusted-source-repository";
import type {
  BrainActivityRepository,
  ExecutiveBriefRepository,
  KnowledgeRepository,
  MemoryRepository,
  ResearchQueueRepository,
  SkillRepository,
  UserRepository,
} from "../index";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function mockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PENDING_STATUSES: ResearchQueueStatus[] = [
  "Queued",
  "Searching",
  "Analysing",
  "Ready",
];

class MockUserRepository implements UserRepository {
  async getProfile(_userId: string): Promise<User | null> {
    return clone(mockUser);
  }

  async upsertProfile(_userId: string, profile: User): Promise<User> {
    return clone(profile);
  }
}

class MockKnowledgeRepository implements KnowledgeRepository {
  private items = clone(mockKnowledgeItems);

  async getAll(_userId: string): Promise<KnowledgeItem[]> {
    return clone(this.items);
  }

  async getById(_userId: string, id: EntityId): Promise<KnowledgeItem | null> {
    return clone(this.items.find((item) => item.id === id) ?? null);
  }

  async search(_userId: string, query: KnowledgeSearchQuery): Promise<KnowledgeItem[]> {
    const items = await this.getAll(_userId);
    return items.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.subcategory && item.subcategory !== query.subcategory) return false;
      if (query.source && item.source !== query.source) return false;
      if (query.importance && item.importance !== query.importance) return false;
      if (query.tags?.length && !query.tags.some((tag) => item.tags.includes(tag))) {
        return false;
      }
      return matchesAnyField(
        query.query,
        [item.title, item.summary, item.content, item.source, item.category, item.subcategory],
        item.tags,
      );
    });
  }

  async create(_userId: string, item: Omit<KnowledgeItem, "id">): Promise<KnowledgeItem> {
    const created = { ...item, id: mockId("know") };
    this.items.unshift(created);
    return clone(created);
  }

  async update(
    _userId: string,
    id: EntityId,
    patch: Partial<KnowledgeItem>,
  ): Promise<KnowledgeItem | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.items[index] = { ...this.items[index], ...patch, id };
    return clone(this.items[index]);
  }

  async delete(_userId: string, id: EntityId): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length < before;
  }
}

class MockMemoryRepository implements MemoryRepository {
  private items = clone(mockMemoryItems);

  async getAll(_userId: string): Promise<MemoryItem[]> {
    return clone(this.items);
  }

  async getById(_userId: string, id: EntityId): Promise<MemoryItem | null> {
    return clone(this.items.find((item) => item.id === id) ?? null);
  }

  async search(_userId: string, query: MemorySearchQuery): Promise<MemoryItem[]> {
    const items = await this.getAll(_userId);
    return items.filter((item) => {
      if (query.category && item.category !== query.category) return false;
      if (query.importance && item.importance !== query.importance) return false;
      if (query.status && item.status !== query.status) return false;
      return matchesAnyField(query.query, [item.title, item.description, item.category]);
    });
  }

  async create(
    _userId: string,
    item: Omit<MemoryItem, "id" | "createdAt">,
    searchTags?: string[],
  ): Promise<MemoryItem> {
    const created: MemoryItem = {
      ...item,
      id: mockId("mem"),
      createdAt: new Date().toISOString(),
      searchTags: searchTags ?? item.searchTags,
    };
    this.items.unshift(created);
    return clone(created);
  }

  async update(
    _userId: string,
    id: EntityId,
    patch: Partial<MemoryItem>,
  ): Promise<MemoryItem | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.items[index] = { ...this.items[index], ...patch, id };
    return clone(this.items[index]);
  }

  async archive(_userId: string, id: EntityId): Promise<MemoryItem | null> {
    return this.update(_userId, id, { status: "archived" });
  }
}

class MockResearchQueueRepository implements ResearchQueueRepository {
  private items = clone(mockResearchQueue);

  async list(_userId: string): Promise<ResearchQueueRecord[]> {
    return clone(this.items);
  }

  async getById(_userId: string, id: EntityId): Promise<ResearchQueueRecord | null> {
    return clone(this.items.find((item) => item.id === id) ?? null);
  }

  async listByStatus(
    _userId: string,
    status: ResearchQueueStatus,
  ): Promise<ResearchQueueRecord[]> {
    return clone(this.items.filter((item) => item.status === status));
  }

  async listPending(_userId: string): Promise<ResearchQueueRecord[]> {
    return clone(this.items.filter((item) => PENDING_STATUSES.includes(item.status)));
  }

  async enqueue(
    _userId: string,
    item: Omit<ResearchQueueRecord, "id" | "queuedAt" | "updatedAt" | "status">,
  ): Promise<ResearchQueueRecord> {
    const now = new Date().toISOString();
    const created: ResearchQueueRecord = {
      ...item,
      id: mockId("rq"),
      status: "Queued",
      queuedAt: now,
      updatedAt: now,
    };
    this.items.unshift(created);
    return clone(created);
  }

  async updateStatus(
    _userId: string,
    id: EntityId,
    status: ResearchQueueStatus,
  ): Promise<ResearchQueueRecord | null> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.items[index] = {
      ...this.items[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    return clone(this.items[index]);
  }

  async approve(userId: string, id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.updateStatus(userId, id, "Approved");
  }

  async reject(userId: string, id: EntityId): Promise<ResearchQueueRecord | null> {
    return this.updateStatus(userId, id, "Rejected");
  }
}

class MockExecutiveBriefRepository implements ExecutiveBriefRepository {
  private activeBrief = clone(mockExecutiveBrief);
  private history: ExecutiveBriefHistoryEntry[] = [
    {
      id: "brief-1",
      headline: mockExecutiveBrief.summary,
      timestamp: new Date().toISOString(),
      topicsUsed: [],
      confidence: mockExecutiveBrief.confidenceScore,
      estimatedReadingSaved: mockExecutiveBrief.workloadEstimate,
    },
  ];

  async getActive(_userId: string): Promise<ExecutiveBrief | null> {
    return clone(this.activeBrief);
  }

  async getAll(_userId: string): Promise<ExecutiveBrief[]> {
    return [clone(this.activeBrief)];
  }

  async getById(_userId: string, id: string): Promise<ExecutiveBrief | null> {
    return id === "brief-1" ? clone(this.activeBrief) : null;
  }

  async create(_userId: string, brief: ExecutiveBrief): Promise<ExecutiveBrief> {
    this.activeBrief = clone(brief);
    return clone(this.activeBrief);
  }

  async update(
    _userId: string,
    id: string,
    brief: Partial<ExecutiveBrief>,
  ): Promise<ExecutiveBrief | null> {
    if (id !== "brief-1") return null;
    this.activeBrief = { ...this.activeBrief, ...brief };
    return clone(this.activeBrief);
  }

  async saveGenerated(_userId: string, brief: AIExecutiveBriefOutput): Promise<void> {
    this.activeBrief = {
      summary: brief.executiveSummary,
      confidenceScore: brief.confidence,
      recommendedFocus: brief.recommendedActions[0] ?? "Review priorities",
      priorities: brief.topPriorities.map((priority, index) => ({
        id: priority.id ?? `p-${index + 1}`,
        title: priority.title,
        description: priority.description,
      })),
      decisions: [],
      risks: brief.risks.map((risk, index) => ({
        id: risk.id ?? `r-${index + 1}`,
        title: risk.title,
      })),
      opportunities: brief.opportunities.map((opportunity, index) => ({
        id: opportunity.id ?? `o-${index + 1}`,
        title: opportunity.title,
      })),
      aiPrepared: [],
      workloadEstimate: brief.estimatedReadingSaved,
    };
  }

  async getHistory(_userId: string): Promise<ExecutiveBriefHistoryEntry[]> {
    return clone(this.history);
  }
}

class MockSkillRepository implements SkillRepository {
  private skills = clone(skillRegistry);

  async listSkills(_userId: string): Promise<SkillDefinition[]> {
    return clone(this.skills);
  }

  async getSkill(_userId: string, id: EntityId): Promise<SkillDefinition | null> {
    return clone(this.skills.find((skill) => skill.id === id) ?? null);
  }

  async getEnabledSkills(_userId: string): Promise<SkillDefinition[]> {
    const skills = await this.listSkills(_userId);
    return skills.filter((skill) => skill.enabled);
  }

  async create(_userId: string, skill: Omit<SkillDefinition, "id">): Promise<SkillDefinition> {
    const created = { ...skill, id: mockId("skill") };
    this.skills.push(created);
    return clone(created);
  }

  async update(
    _userId: string,
    id: EntityId,
    patch: Partial<SkillDefinition>,
  ): Promise<SkillDefinition | null> {
    const index = this.skills.findIndex((skill) => skill.id === id);
    if (index === -1) return null;
    this.skills[index] = { ...this.skills[index], ...patch, id };
    return clone(this.skills[index]);
  }

  async delete(_userId: string, id: EntityId): Promise<boolean> {
    const before = this.skills.length;
    this.skills = this.skills.filter((skill) => skill.id !== id);
    return this.skills.length < before;
  }
}

class MockBrainActivityRepository implements BrainActivityRepository {
  private items: BrainActivityItem[] = clone(mockExecutiveBrain.activity);

  async list(_userId: string, limit = 20): Promise<BrainActivityItem[]> {
    return clone(this.items.slice(0, limit));
  }

  async add(_userId: string, action: string, target: string): Promise<BrainActivityItem> {
    const created: BrainActivityItem = {
      id: mockId("act"),
      action,
      target,
      timestamp: "Just now",
    };
    this.items.unshift(created);
    return clone(created);
  }
}

let cachedMockRepositories: Repositories | null = null;

export function createMockRepositories(): Repositories {
  if (cachedMockRepositories) {
    return cachedMockRepositories;
  }

  cachedMockRepositories = {
    users: new MockUserRepository(),
    knowledge: new MockKnowledgeRepository(),
    memory: new MockMemoryRepository(),
    researchQueue: new MockResearchQueueRepository(),
    executiveBriefs: new MockExecutiveBriefRepository(),
    skills: new MockSkillRepository(),
    brainActivity: new MockBrainActivityRepository(),
    trustedSources: new MockTrustedSourceRepository(),
  };

  return cachedMockRepositories;
}

export type { TrustedSourceRepository };
