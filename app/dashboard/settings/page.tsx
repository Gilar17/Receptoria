import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { EmptyState } from "@/app/dashboard/_components/empty-state";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();

  return (
    <>
      <DashboardHeader user={session.user} sectionTitle="Настройки" />
      <EmptyState
        title="Настройки"
        description="Настройки появятся позже."
      />
    </>
  );
}
