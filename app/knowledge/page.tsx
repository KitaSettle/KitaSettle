import { AppShell } from "@/components/layout/AppShell";
import { ExecutiveBrainContent } from "@/components/executive-brain/ExecutiveBrainContent";
import { mockExecutiveBrain } from "@/data/mockExecutiveBrain";

export default function ExecutiveBrainPage() {
  return (
    <AppShell>
      <ExecutiveBrainContent data={mockExecutiveBrain} />
    </AppShell>
  );
}
