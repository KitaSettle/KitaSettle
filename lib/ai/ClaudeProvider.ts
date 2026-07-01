import { FutureAdapter } from "@/lib/providers/types/base";
import type { AIProvider } from "./AIProvider";
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

function stub(): never {
  throw new Error("stub");
}

export class ClaudeProvider extends FutureAdapter implements AIProvider {
  readonly name = "claude";
  readonly implementation = "adapter";

  async summarize(input: SummarizeInput): Promise<SummarizeOutput> {
    void input;
    this.notConfigured();
    stub();
  }

  async classify(input: ClassifyInput): Promise<ClassifyOutput> {
    void input;
    this.notConfigured();
    stub();
  }

  async extractRisks(input: ExtractRisksInput): Promise<ExtractRisksOutput> {
    void input;
    this.notConfigured();
    stub();
  }

  async extractOpportunities(
    input: ExtractOpportunitiesInput,
  ): Promise<ExtractOpportunitiesOutput> {
    void input;
    this.notConfigured();
    stub();
  }

  async generateExecutiveBrief(
    input: AIExecutiveBriefInput,
  ): Promise<AIExecutiveBriefOutput> {
    void input;
    this.notConfigured();
    stub();
  }

  async compareDocuments(input: CompareDocumentsInput): Promise<CompareDocumentsOutput> {
    void input;
    this.notConfigured();
    stub();
  }
}
