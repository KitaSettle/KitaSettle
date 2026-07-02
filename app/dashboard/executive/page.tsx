import { AppShell } from "@/components/layout/AppShell";
import { ExecutiveDailyLoader } from "@/components/executive-daily/ExecutiveDailyLoader";

export default function ExecutiveDailyPage() {
  return (
    <AppShell>
      <ExecutiveDailyLoader />
    </AppShell>
  );
}
