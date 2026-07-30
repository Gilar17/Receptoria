import Image from "next/image";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireAuth();
  const { user } = session;

  return (
    <>
      <DashboardHeader user={user} title="Профиль" />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Аватар"}
              width={80}
              height={80}
              className="rounded-full border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-2xl font-semibold text-sky-700">
              {(user.name?.[0] ?? user.email?.[0] ?? "R").toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Receptoria
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {user.name ?? "Пользователь"}
            </h2>
            {user.email ? (
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
            ) : null}
            <p className="mt-4 text-sm text-slate-500">
              Редактирование профиля появится позже.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
