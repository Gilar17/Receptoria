import type { RecipeSortMode, RecipeViewMode } from "@/lib/recipes/helpers";

export type RecipeListUrlParams = {
  q?: string;
  page?: number;
  category?: string;
  view?: RecipeViewMode;
  sort?: RecipeSortMode;
};

/** Собирает query string для списков рецептов, сохраняя активные фильтры. */
export function buildRecipeListQuery(params: RecipeListUrlParams): string {
  const searchParams = new URLSearchParams();

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.view === "table") {
    searchParams.set("view", "table");
  }

  if (params.sort === "popular") {
    searchParams.set("sort", "popular");
  }

  return searchParams.toString();
}

export function buildRecipeListHref(
  basePath: string,
  params: RecipeListUrlParams,
): string {
  const query = buildRecipeListQuery(params);
  return query ? `${basePath}?${query}` : basePath;
}

/** Читает параметры списка из URLSearchParams (клиент). */
export function readRecipeListParams(searchParams: URLSearchParams): {
  q: string;
  page: number;
  category?: string;
  view: RecipeViewMode;
} {
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const category = searchParams.get("category")?.trim() || undefined;

  return {
    q: searchParams.get("q")?.trim() ?? "",
    page,
    category,
    view: searchParams.get("view") === "table" ? "table" : "cards",
  };
}
