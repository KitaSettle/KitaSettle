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
    <div className="min-h-screen bg-background px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <MissionControlDashboard />
      </div>
    </div>
  );
}
