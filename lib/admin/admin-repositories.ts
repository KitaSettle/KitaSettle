import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config/env";
import {
  MockAnalyticsRepository,
  SupabaseAnalyticsRepository,
  type AnalyticsRepository,
} from "@/lib/repositories/analytics-repository";
import {
  MockBetaAdminRepository,
  SupabaseBetaAdminRepository,
  type BetaAdminRepository,
} from "@/lib/repositories/beta-admin-repository";
import {
  MockErrorRepository,
  SupabaseErrorRepository,
  type ErrorRepository,
} from "@/lib/repositories/error-repository";
import {
  MockFeedbackRepository,
  SupabaseFeedbackRepository,
  type FeedbackRepository,
} from "@/lib/repositories/feedback-repository";

export interface AdminRepositories {
  analytics: AnalyticsRepository;
  feedback: FeedbackRepository;
  errors: ErrorRepository;
  beta: BetaAdminRepository;
}

export function getAdminRepositories(): AdminRepositories {
  if (!isSupabaseConfigured()) {
    return {
      analytics: new MockAnalyticsRepository(),
      feedback: new MockFeedbackRepository(),
      errors: new MockErrorRepository(),
      beta: new MockBetaAdminRepository(),
    };
  }

  const client = createAdminClient();
  return {
    analytics: new SupabaseAnalyticsRepository(client),
    feedback: new SupabaseFeedbackRepository(client),
    errors: new SupabaseErrorRepository(client),
    beta: new SupabaseBetaAdminRepository(client),
  };
}
