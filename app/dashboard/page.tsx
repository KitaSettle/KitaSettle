import { AppShell } from "@/components/layout/AppShell";
import { DashboardLoader } from "@/components/dashboard/DashboardLoader";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardLoader />
    </AppShell>
  );
}
