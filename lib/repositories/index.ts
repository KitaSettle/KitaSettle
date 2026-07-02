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
import {
  SupabaseExecutiveDNARepository,
  type ExecutiveDNARepository,
} from "./executive-dna-repository";
import {
  SupabaseIntegrationRepository,
  type IntegrationRepository,
} from "./integration-repository";
import {
  SupabaseCalendarRepository,
  type CalendarRepository,
} from "./calendar-repository";
import {
  SupabaseEmailRepository,
  type EmailRepository,
} from "./email-repository";
import {
  SupabaseDocumentRepository,
  type DocumentRepository,
} from "./document-repository";
import {
  SupabaseDecisionRepository,
  type DecisionRepository,
} from "./decision-repository";
import {
  SupabaseTrustedSourceRepository,
  type TrustedSourceRepository,
} from "./trusted-source-repository";

export interface Repositories {
  users: UserRepository;
  knowledge: KnowledgeRepository;
  memory: MemoryRepository;
  researchQueue: ResearchQueueRepository;
  executiveBriefs: ExecutiveBriefRepository;
  skills: SkillRepository;
  brainActivity: BrainActivityRepository;
  trustedSources: TrustedSourceRepository;
  executiveDna: ExecutiveDNARepository;
  integrations: IntegrationRepository;
  calendar: CalendarRepository;
  email: EmailRepository;
  documents: DocumentRepository;
  decisions: DecisionRepository;
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
    trustedSources: new SupabaseTrustedSourceRepository(client),
    executiveDna: new SupabaseExecutiveDNARepository(client),
    integrations: new SupabaseIntegrationRepository(client),
    calendar: new SupabaseCalendarRepository(client),
    email: new SupabaseEmailRepository(client),
    documents: new SupabaseDocumentRepository(client),
    decisions: new SupabaseDecisionRepository(client),
  };
}

export type {
  KnowledgeRepository,
  MemoryRepository,
  ResearchQueueRepository,
  ExecutiveBriefRepository,
  ExecutiveDNARepository,
  IntegrationRepository,
  CalendarRepository,
  EmailRepository,
  DocumentRepository,
  DecisionRepository,
  SkillRepository,
  UserRepository,
  BrainActivityRepository,
  TrustedSourceRepository,
};
