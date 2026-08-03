import Link from "next/link";
import { getSession } from "@/lib/auth";
import { HeaderNav } from "@/components/layout/header-nav";

export async function Header() {
  const session = await getSession();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Receptoria
        </Link>
        <HeaderNav user={user} />
      </div>
    </header>
  );
}
