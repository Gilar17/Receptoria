"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOutAction } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

type HeaderUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type HeaderNavProps = {
  user: HeaderUser | null;
};

const NAV_LINKS = [
  { href: "/", label: "Главная", exact: true },
  { href: "/catalog", label: "Каталог" },
  { href: "/dashboard", label: "Мои рецепты", requiresAuth: true },
] as const;

function NavLink({
  href,
  label,
  exact,
  onNavigate,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
        isActive
          ? "bg-sky-50 text-sky-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {label}
    </Link>
  );
}

function SignOutLink({ className }: { className?: string }) {
  return (
    <form action={signOutAction} className={className}>
      <button
        type="submit"
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        Выйти
      </button>
    </form>
  );
}

function UserMenu({ user }: { user: HeaderUser }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Аватар"}
            width={32}
            height={32}
            className="rounded-full border border-slate-200"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {(user.name?.[0] ?? user.email?.[0] ?? "R").toUpperCase()}
          </div>
        )}
        <span className="max-w-[140px] truncate text-sm font-medium text-slate-800">
          {user.name ?? "Пользователь"}
        </span>
      </div>
      <SignOutLink />
    </div>
  );
}

export function HeaderNav({ user }: HeaderNavProps) {
  const myRecipesHref = user ? "/dashboard" : "/login?callbackUrl=%2Fdashboard";

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map(({ href, label, ...item }) => {
          const exact = "exact" in item && item.exact;
          const requiresAuth = "requiresAuth" in item && item.requiresAuth;
          const linkHref = requiresAuth ? myRecipesHref : href;

          return (
            <NavLink key={href} href={linkHref} label={label} exact={exact} />
          );
        })}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Button asChild size="sm">
            <Link href="/login">Войти</Link>
          </Button>
        )}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Открыть меню"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px]">
          <div className="mt-6 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, ...item }) => {
              const exact = "exact" in item && item.exact;
              const requiresAuth = "requiresAuth" in item && item.requiresAuth;
              const linkHref = requiresAuth ? myRecipesHref : href;

              return (
                <NavLink key={href} href={linkHref} label={label} exact={exact} />
              );
            })}
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? "Аватар"}
                      width={40}
                      height={40}
                      className="rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                      {(user.name?.[0] ?? user.email?.[0] ?? "R").toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {user.name ?? "Пользователь"}
                    </p>
                  </div>
                </div>
                <SignOutLink />
              </div>
            ) : (
              <Button asChild className="w-full">
                <Link href="/login">Войти</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
