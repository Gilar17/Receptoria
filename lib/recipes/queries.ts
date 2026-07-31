import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-client";
import { DEFAULT_CATEGORY_NAME, RECIPES_PAGE_SIZE } from "@/lib/recipes/constants";
import { findCategoryByNameCaseInsensitive, sortCategoryOptions } from "@/lib/recipes/category-helpers";
import {
  buildSearchWhere,
  parseCategoryParam,
  parsePageParam,
  parseSearchQuery,
} from "@/lib/recipes/helpers";
import { RecipeVisibility, type Prisma } from "@prisma/client";

export type ListParams = {
  q?: string;
  page?: string;
  category?: string;
};

export type CategoryOption = {
  id: string;
  category: string;
};

export type RecipeListItem = {
  id: string;
  title: string;
  content: string;
  visibility: RecipeVisibility;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  categoryId: string;
  category: {
    id: string;
    category: string;
  };
  owner: {
    name: string | null;
    image: string | null;
  };
};

export type PaginatedRecipes = {
  items: RecipeListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const recipeSelect = {
  id: true,
  title: true,
  content: true,
  visibility: true,
  isFavorite: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  categoryId: true,
  category: { select: { id: true, category: true } },
  owner: { select: { name: true, image: true } },
} as const;

function buildCategoryWhere(categoryId: string | undefined) {
  if (!categoryId) {
    return {};
  }
  return { categoryId };
}

type RecipeWhereInput = Prisma.RecipeWhereInput;

async function fetchRecipeListPage(where: RecipeWhereInput, page: number) {
  return withDbRetry("recipe.listPage", async () => {
    const total = await prisma.recipe.count({ where });
    const items = await prisma.recipe.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * RECIPES_PAGE_SIZE,
      take: RECIPES_PAGE_SIZE,
      select: recipeSelect,
    });

    return { total, items };
  });
}

async function getDefaultCategoryId(): Promise<string> {
  const existing = await withDbRetry("category.findDefault", () =>
    findCategoryByNameCaseInsensitive(prisma, DEFAULT_CATEGORY_NAME),
  );

  if (existing) {
    return existing.id;
  }

  return withDbRetry("category.createDefault", () =>
    prisma.category.create({
      data: { category: DEFAULT_CATEGORY_NAME },
    }),
  ).then((created) => created.id);
}

export async function getCategories(): Promise<CategoryOption[]> {
  const categories = await withDbRetry("category.findMany", () =>
    prisma.category.findMany({
      select: { id: true, category: true },
    }),
  );

  return sortCategoryOptions(categories);
}

export async function getMyRecipes(
  ownerId: string,
  params: ListParams = {},
): Promise<PaginatedRecipes> {
  const q = parseSearchQuery(params.q);
  const page = parsePageParam(params.page);
  const categoryId = parseCategoryParam(params.category);

  const where = {
    ownerId,
    ...buildCategoryWhere(categoryId),
    ...(buildSearchWhere(q) ?? {}),
  };

  const { total, items } = await fetchRecipeListPage(where, page);

  const totalPages = Math.max(1, Math.ceil(total / RECIPES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page && total > 0) {
    return getMyRecipes(ownerId, { ...params, page: String(safePage) });
  }

  return {
    items,
    total,
    page: safePage,
    pageSize: RECIPES_PAGE_SIZE,
    totalPages,
  };
}

export async function getPublicRecipesPaginated(
  params: ListParams = {},
): Promise<PaginatedRecipes> {
  const q = parseSearchQuery(params.q);
  const page = parsePageParam(params.page);
  const categoryId = parseCategoryParam(params.category);

  const where = {
    visibility: RecipeVisibility.PUBLIC,
    ...buildCategoryWhere(categoryId),
    ...(buildSearchWhere(q) ?? {}),
  };

  const { total, items } = await fetchRecipeListPage(where, page);

  const totalPages = Math.max(1, Math.ceil(total / RECIPES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page && total > 0) {
    return getPublicRecipesPaginated({ ...params, page: String(safePage) });
  }

  return {
    items,
    total,
    page: safePage,
    pageSize: RECIPES_PAGE_SIZE,
    totalPages,
  };
}

export async function getFavoriteRecipes(
  ownerId: string,
  params: ListParams = {},
): Promise<PaginatedRecipes> {
  const q = parseSearchQuery(params.q);
  const page = parsePageParam(params.page);
  const categoryId = parseCategoryParam(params.category);

  const where = {
    ownerId,
    isFavorite: true,
    ...buildCategoryWhere(categoryId),
    ...(buildSearchWhere(q) ?? {}),
  };

  const { total, items } = await fetchRecipeListPage(where, page);

  const totalPages = Math.max(1, Math.ceil(total / RECIPES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  if (safePage !== page && total > 0) {
    return getFavoriteRecipes(ownerId, { ...params, page: String(safePage) });
  }

  return {
    items,
    total,
    page: safePage,
    pageSize: RECIPES_PAGE_SIZE,
    totalPages,
  };
}

export async function getRecipeByIdForOwner(recipeId: string, ownerId: string) {
  const recipe = await withDbRetry("recipe.findById", () =>
    prisma.recipe.findUnique({ where: { id: recipeId } }),
  );
  if (!recipe || recipe.ownerId !== ownerId) {
    return null;
  }
  return recipe;
}

export { getDefaultCategoryId };
