import Image from "next/image";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth();
  const user = session.user;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Аватар"}
              width={56}
              height={56}
              className="rounded-full border border-zinc-200"
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 text-lg font-medium text-zinc-600"
              aria-hidden="true"
            >
              {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Личный кабинет
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Добро пожаловать{user.name ? `, ${user.name}` : ""}!
            </p>
          </div>
        </div>
        <SignOutButton />
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Профиль
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-zinc-500">Email</dt>
            <dd>{user.email ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-zinc-500">Имя</dt>
            <dd>{user.name ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <nav className="flex flex-wrap gap-3">
        <Link
          href="/my-recipes"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-zinc-50"
        >
          Мои рецепты
        </Link>
        <Link
          href="/"
          className="rounded-xl px-4 py-2 text-sm text-zinc-600 transition hover:text-zinc-900"
        >
          На главную
        </Link>
      </nav>
    </main>
  );
}
