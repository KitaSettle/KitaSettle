export interface WhyTransparency {
  whyMatters: string;
  whyNow: string;
  confidence: number;
  confidenceLabel: string;
  informationUsed: string[];
  informationMissing: string[];
  ifIgnored?: string;
  expectedOutcome?: string;
}
