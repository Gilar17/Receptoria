import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await requireAuth();

  return (
    <>
      <DashboardHeader user={session.user} title="История" />
      <EmptyState
        title="История"
        description="История появится позже."
      />
    </>
  );
}
