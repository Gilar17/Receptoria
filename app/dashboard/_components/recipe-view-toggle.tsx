"use client";

import { LayoutGrid, TableProperties } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { RecipeViewMode } from "@/lib/recipes/helpers";

export function RecipeViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: RecipeViewMode =
    searchParams.get("view") === "table" ? "table" : "cards";

  const setView = (nextView: RecipeViewMode) => {
    if (nextView === view) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (nextView === "table") {
      params.set("view", "table");
    } else {
      params.delete("view");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
      role="group"
      aria-label="Режим отображения"
    >
      <button
        type="button"
        onClick={() => setView("cards")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          view === "cards"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50",
        )}
        aria-pressed={view === "cards"}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Карточки
      </button>
      <button
        type="button"
        onClick={() => setView("table")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          view === "table"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50",
        )}
        aria-pressed={view === "table"}
      >
        <TableProperties className="h-3.5 w-3.5" />
        Таблица
      </button>
    </div>
  );
}
