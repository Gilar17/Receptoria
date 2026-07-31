"use client";

import { Suspense } from "react";
import { RecipeSearch } from "@/app/dashboard/_components/recipe-search";
import { RecipeCategoryFilter } from "@/app/dashboard/_components/recipe-category-filter";
import { RecipeSortToggle } from "@/app/dashboard/_components/recipe-sort-toggle";
import { RecipeViewToggle } from "@/app/dashboard/_components/recipe-view-toggle";
import type { CategoryOption } from "@/lib/recipes/queries";

type RecipeListToolbarProps = {
  categories: CategoryOption[];
  searchPlaceholder?: string;
  showSort?: boolean;
};

export function RecipeListToolbar({
  categories,
  searchPlaceholder,
  showSort = false,
}: RecipeListToolbarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Suspense fallback={null}>
          <RecipeSearch placeholder={searchPlaceholder} />
        </Suspense>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
          {showSort ? (
            <Suspense fallback={null}>
              <RecipeSortToggle />
            </Suspense>
          ) : null}
          <Suspense fallback={null}>
            <RecipeCategoryFilter categories={categories} />
          </Suspense>
          <Suspense fallback={null}>
            <RecipeViewToggle />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
