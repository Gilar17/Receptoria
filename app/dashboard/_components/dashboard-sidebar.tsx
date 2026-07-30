"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  BookOpenText,
  Globe,
  History,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

type DashboardUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const NAV_ITEMS = [
  { href: "/dashboard/profile", label: "Профиль", icon: UserRound },
  { href: "/dashboard", label: "Мои рецепты", icon: BookOpenText, exact: true },
  { href: "/dashboard/public", label: "Публичные рецепты", icon: Globe },
  { href: "/dashboard/favorites", label: "Избранное", icon: Bookmark },
  { href: "/dashboard/history", label: "История", icon: History },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
] as const;

type DashboardSidebarProps = {
  user: DashboardUser;
  className?: string;
  onNavigate?: () => void;
};

export function DashboardSidebar({
  user,
  className,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col bg-gradient-to-b from-[#e8f4fc] to-[#dbeef8] px-4 py-6",
        className,
      )}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "Аватар"}
            width={48}
            height={48}
            className="rounded-full border border-white/80 shadow-sm"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-base font-semibold text-slate-700 shadow-sm">
            {(user.name?.[0] ?? user.email?.[0] ?? "R").toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user.name ?? "Пользователь"}
          </p>
          <p className="truncate text-xs text-slate-600">Receptoria</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, ...item }) => {
          const exact = "exact" in item && item.exact;
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                isActive
                  ? "bg-white/90 text-slate-900 shadow-sm"
                  : "text-slate-700 hover:bg-white/50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-2">
        <SignOutButton />
      </div>
    </aside>
  );
}
