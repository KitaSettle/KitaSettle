import { redirect } from "next/navigation";
import { requireAdminUserId } from "@/lib/admin/admin-guard";
import { MissionControlDashboard } from "@/components/mission-control/MissionControlDashboard";
import { isErrorResponse } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export default async function MissionControlPage() {
  const admin = await requireAdminUserId();
  if (isErrorResponse(admin)) {
    redirect("/dashboard/executive");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <MissionControlDashboard />
      </div>
    </div>
  );
}
