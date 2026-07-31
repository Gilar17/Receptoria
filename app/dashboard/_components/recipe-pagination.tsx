import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildRecipeListHref } from "@/lib/recipes/url-params";
import type { RecipeSortMode, RecipeViewMode } from "@/lib/recipes/helpers";

type RecipePaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  q?: string;
  category?: string;
  view?: RecipeViewMode;
  sort?: RecipeSortMode;
};

export function RecipePagination({
  page,
  totalPages,
  basePath,
  q,
  category,
  view,
  sort,
}: RecipePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - page) <= 1,
  );

  const items: Array<number | "ellipsis"> = [];
  for (let index = 0; index < pages.length; index += 1) {
    const current = pages[index];
    const previous = pages[index - 1];
    if (index > 0 && previous !== undefined && current - previous > 1) {
      items.push("ellipsis");
    }
    items.push(current);
  }

  const hrefFor = (targetPage: number) =>
    buildRecipeListHref(basePath, { page: targetPage, q, category, view, sort });

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="Пагинация"
    >
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={page <= 1}
        className={cn(page <= 1 && "pointer-events-none opacity-50")}
      >
        <Link href={hrefFor(Math.max(1, page - 1))} aria-label="Назад">
          <ChevronLeft className="h-4 w-4" />
          Назад
        </Link>
      </Button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={hrefFor(item)}>{item}</Link>
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={page >= totalPages}
        className={cn(page >= totalPages && "pointer-events-none opacity-50")}
      >
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-label="Вперёд"
        >
          Вперёд
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
