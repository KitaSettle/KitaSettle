import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DISCOVERY_CONFIDENCE_TARGET } from "@/lib/types/executive-dna";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("executive_dna_profiles")
    .select("overall_confidence, interview_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  const needsDiscovery =
    !profile ||
    !profile.interview_complete ||
    Number(profile.overall_confidence) < DISCOVERY_CONFIDENCE_TARGET;

  redirect(needsDiscovery ? "/dashboard/discovery" : "/dashboard/executive");
}
