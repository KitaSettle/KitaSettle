import { AppShell } from "@/components/layout/AppShell";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { mockExecutiveBrief } from "@/data/mockExecutiveBrief";
import { mockUser } from "@/data/mockUser";

const quickActions = [
  { id: "qa1", label: "Review proposal" },
  { id: "qa2", label: "Approve direction" },
  { id: "qa3", label: "Open Executive Brain" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent
        name={mockUser.name}
        brief={mockExecutiveBrief}
        quickActions={quickActions}
      />
    </AppShell>
  );
}
