import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORY_NAME, RECIPES_PAGE_SIZE } from "@/lib/recipes/constants";
import {
  buildSearchWhere,
  normalizePageAfterDelete,
  parsePageParam,
  parseSearchQuery,
} from "@/lib/recipes/helpers";
import { RecipeVisibility } from "@prisma/client";

type ListParams = {
  q?: string;
  page?: string;
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

async function getDefaultCategoryId(): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { category: DEFAULT_CATEGORY_NAME },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.category.create({
    data: { category: DEFAULT_CATEGORY_NAME },
  });

  return created.id;
}

export async function getMyRecipes(
  ownerId: string,
  params: ListParams = {},
): Promise<PaginatedRecipes> {
  const q = parseSearchQuery(params.q);
  const page = parsePageParam(params.page);

  const where = {
    ownerId,
    ...(buildSearchWhere(q) ?? {}),
  };

  const [total, items] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * RECIPES_PAGE_SIZE,
      take: RECIPES_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        content: true,
        visibility: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { select: { name: true, image: true } },
      },
    }),
  ]);

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

  const where = {
    visibility: RecipeVisibility.PUBLIC,
    ...(buildSearchWhere(q) ?? {}),
  };

  const [total, items] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * RECIPES_PAGE_SIZE,
      take: RECIPES_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        content: true,
        visibility: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { select: { name: true, image: true } },
      },
    }),
  ]);

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

  const where = {
    ownerId,
    isFavorite: true,
    ...(buildSearchWhere(q) ?? {}),
  };

  const [total, items] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * RECIPES_PAGE_SIZE,
      take: RECIPES_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        content: true,
        visibility: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: { select: { name: true, image: true } },
      },
    }),
  ]);

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
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe || recipe.ownerId !== ownerId) {
    return null;
  }
  return recipe;
}

export { getDefaultCategoryId, normalizePageAfterDelete };
