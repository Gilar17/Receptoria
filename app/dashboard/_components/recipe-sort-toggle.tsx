"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { RecipeSortMode } from "@/lib/recipes/helpers";

export function RecipeSortToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort: RecipeSortMode =
    searchParams.get("sort") === "popular" ? "popular" : "recent";

  const setSort = (nextSort: RecipeSortMode) => {
    if (nextSort === sort) return;

    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === "popular") {
      params.set("sort", "popular");
    } else {
      params.delete("sort");
    }

    params.set("page", "1");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
      role="group"
      aria-label="Сортировка рецептов"
    >
      <button
        type="button"
        onClick={() => setSort("recent")}
        className={cn(
          "inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          sort === "recent"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50",
        )}
        aria-pressed={sort === "recent"}
      >
        Новые
      </button>
      <button
        type="button"
        onClick={() => setSort("popular")}
        className={cn(
          "inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          sort === "popular"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50",
        )}
        aria-pressed={sort === "popular"}
      >
        Популярные
      </button>
    </div>
  );
}
