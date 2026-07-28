import { requireAuth } from "@/lib/auth";
import { DashboardSidebar } from "@/app/dashboard/_components/dashboard-sidebar";
import { DashboardToaster } from "@/app/dashboard/_components/dashboard-toaster";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <DashboardSidebar user={session.user} />
      </div>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <DashboardToaster />
    </div>
  );
}
