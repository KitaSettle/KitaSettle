import type { ProviderMetadata } from "@/lib/providers/types/base";
import type {
  AIExecutiveBriefInput,
  AIExecutiveBriefOutput,
  ClassifyInput,
  ClassifyOutput,
  CompareDocumentsInput,
  CompareDocumentsOutput,
  ExtractOpportunitiesInput,
  ExtractOpportunitiesOutput,
  ExtractRisksInput,
  ExtractRisksOutput,
  SummarizeInput,
  SummarizeOutput,
} from "./types";

export interface AIProvider extends ProviderMetadata {
  summarize(input: SummarizeInput): Promise<SummarizeOutput>;
  classify(input: ClassifyInput): Promise<ClassifyOutput>;
  extractRisks(input: ExtractRisksInput): Promise<ExtractRisksOutput>;
  extractOpportunities(input: ExtractOpportunitiesInput): Promise<ExtractOpportunitiesOutput>;
  generateExecutiveBrief(input: AIExecutiveBriefInput): Promise<AIExecutiveBriefOutput>;
  compareDocuments(input: CompareDocumentsInput): Promise<CompareDocumentsOutput>;
}

export type {
  AIExecutiveBriefInput,
  AIExecutiveBriefOutput,
  ClassifyInput,
  ClassifyOutput,
  CompareDocumentsInput,
  CompareDocumentsOutput,
  ExtractOpportunitiesInput,
  ExtractOpportunitiesOutput,
  ExtractRisksInput,
  ExtractRisksOutput,
  SummarizeInput,
  SummarizeOutput,
};
