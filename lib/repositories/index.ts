import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseKnowledgeRepository,
  type KnowledgeRepository,
} from "./knowledge-repository";
import {
  SupabaseMemoryRepository,
  type MemoryRepository,
} from "./memory-repository";
import {
  SupabaseResearchQueueRepository,
  type ResearchQueueRepository,
} from "./research-queue-repository";
import {
  SupabaseExecutiveBriefRepository,
  type ExecutiveBriefRepository,
} from "./executive-brief-repository";
import {
  SupabaseSkillRepository,
  type SkillRepository,
} from "./skill-repository";
import {
  SupabaseBrainActivityRepository,
  SupabaseUserRepository,
  type BrainActivityRepository,
  type UserRepository,
} from "./user-repository";

export interface Repositories {
  users: UserRepository;
  knowledge: KnowledgeRepository;
  memory: MemoryRepository;
  researchQueue: ResearchQueueRepository;
  executiveBriefs: ExecutiveBriefRepository;
  skills: SkillRepository;
  brainActivity: BrainActivityRepository;
}

export function createRepositories(client: SupabaseClient): Repositories {
  return {
    users: new SupabaseUserRepository(client),
    knowledge: new SupabaseKnowledgeRepository(client),
    memory: new SupabaseMemoryRepository(client),
    researchQueue: new SupabaseResearchQueueRepository(client),
    executiveBriefs: new SupabaseExecutiveBriefRepository(client),
    skills: new SupabaseSkillRepository(client),
    brainActivity: new SupabaseBrainActivityRepository(client),
  };
}

export type {
  KnowledgeRepository,
  MemoryRepository,
  ResearchQueueRepository,
  ExecutiveBriefRepository,
  SkillRepository,
  UserRepository,
  BrainActivityRepository,
};
