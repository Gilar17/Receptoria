import { prisma } from "@/lib/prisma";
import type { Prisma, Recipe, RecipeVisibility } from "@prisma/client";

export type CreateRecipeInput = {
  title: string;
  content: string;
  description?: string | null;
  categoryId: string;
  visibility?: RecipeVisibility;
};

export type UpdateRecipeInput = {
  title?: string;
  content?: string;
  description?: string | null;
  categoryId?: string;
  visibility?: RecipeVisibility;
};

/**
 * Server-side: рецепты текущего владельца (ownerId === session.user.id).
 */
export async function getRecipesByOwner(ownerId: string) {
  return prisma.recipe.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { category: true } },
    },
  });
}

/**
 * Server-side: получить рецепт с проверкой доступа.
 * PUBLIC — доступен всем; PRIVATE — только владельцу.
 */
export async function getRecipeForUser(
  recipeId: string,
  userId: string | null,
): Promise<Recipe | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    return null;
  }

  if (recipe.visibility === "PUBLIC") {
    return recipe;
  }

  if (!userId || recipe.ownerId !== userId) {
    return null;
  }

  return recipe;
}

/**
 * Server-side: список публичных рецептов.
 */
export async function getPublicRecipes() {
  return prisma.recipe.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, image: true } },
      category: { select: { category: true } },
    },
  });
}

/**
 * Server-side: создать рецепт. ownerId берётся только из сессии, не из запроса.
 */
export async function createRecipeForOwner(
  ownerId: string,
  input: CreateRecipeInput,
) {
  return prisma.recipe.create({
    data: {
      title: input.title,
      content: input.content,
      description: input.description ?? null,
      categoryId: input.categoryId,
      visibility: input.visibility ?? "PRIVATE",
      ownerId,
    },
  });
}

/**
 * Server-side: обновить рецепт только если session.user.id === recipe.ownerId.
 * ownerId из формы/запроса игнорируется.
 */
export async function updateRecipeForOwner(
  recipeId: string,
  ownerId: string,
  input: UpdateRecipeInput,
) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe || recipe.ownerId !== ownerId) {
    return null;
  }

  const data: Prisma.RecipeUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.description !== undefined) data.description = input.description;
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }
  if (input.visibility !== undefined) data.visibility = input.visibility;

  return prisma.recipe.update({
    where: { id: recipeId },
    data,
  });
}

/**
 * Server-side: удалить рецепт только если session.user.id === recipe.ownerId.
 */
export async function deleteRecipeForOwner(
  recipeId: string,
  ownerId: string,
): Promise<boolean> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe || recipe.ownerId !== ownerId) {
    return false;
  }

  await prisma.recipe.delete({
    where: { id: recipeId },
  });

  return true;
}

/**
 * Server-side: проверка права редактирования/удаления.
 */
export function canModifyRecipe(recipe: Recipe, userId: string | null): boolean {
  return Boolean(userId && recipe.ownerId === userId);
}
