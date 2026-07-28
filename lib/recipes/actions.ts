"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RECIPES_PAGE_SIZE } from "@/lib/recipes/constants";
import {
  normalizePageAfterDelete,
  visibilityFromIsPublic,
} from "@/lib/recipes/helpers";
import {
  getDefaultCategoryId,
  getRecipeByIdForOwner,
} from "@/lib/recipes/queries";
import {
  deleteRecipeSchema,
  recipeFormSchema,
  toggleFavoriteSchema,
  togglePublicSchema,
  updateRecipeSchema,
} from "@/lib/recipes/schema";

export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

const REVALIDATE_PATHS = [
  "/dashboard",
  "/dashboard/public",
  "/dashboard/favorites",
] as const;

function revalidateDashboardPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

/** Получить userId только из серверной сессии */
async function requireUserId(): Promise<string | ActionResult<never>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Необходимо войти в аккаунт" };
  }
  return session.user.id;
}

export async function createRecipe(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = recipeFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  try {
    const categoryId = await getDefaultCategoryId();
    const visibility = visibilityFromIsPublic(parsed.data.isPublic);

    const recipe = await prisma.recipe.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        ownerId: userId,
        categoryId,
        visibility,
        publishedAt: parsed.data.isPublic ? new Date() : null,
      },
    });

    revalidateDashboardPaths();
    return {
      success: true,
      data: { id: recipe.id },
      message: "Рецепт успешно создан",
    };
  } catch (error) {
    console.error("createRecipe:", error);
    return { success: false, error: "Не удалось создать рецепт" };
  }
}

export async function updateRecipe(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = updateRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  // Проверка владельца перед изменением
  const existing = await getRecipeByIdForOwner(parsed.data.id, userId);
  if (!existing) {
    return { success: false, error: "Рецепт не найден или доступ запрещён" };
  }

  try {
    const visibility = visibilityFromIsPublic(parsed.data.isPublic);

    await prisma.recipe.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        visibility,
        publishedAt: parsed.data.isPublic ? new Date() : null,
      },
    });

    revalidateDashboardPaths();
    return {
      success: true,
      data: { id: parsed.data.id },
      message: "Рецепт сохранён",
    };
  } catch (error) {
    console.error("updateRecipe:", error);
    return { success: false, error: "Не удалось сохранить рецепт" };
  }
}

export async function deleteRecipe(
  input: unknown,
): Promise<ActionResult<{ redirectPage?: number }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = deleteRecipeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  const existing = await getRecipeByIdForOwner(parsed.data.id, userId);
  if (!existing) {
    return { success: false, error: "Рецепт не найден или доступ запрещён" };
  }

  try {
    await prisma.recipe.delete({ where: { id: parsed.data.id } });

    const remaining = await prisma.recipe.count({ where: { ownerId: userId } });
    const redirectPage = normalizePageAfterDelete(
      1,
      remaining,
      RECIPES_PAGE_SIZE,
    );

    revalidateDashboardPaths();
    return {
      success: true,
      data: { redirectPage },
      message: "Рецепт удалён",
    };
  } catch (error) {
    console.error("deleteRecipe:", error);
    return { success: false, error: "Не удалось удалить рецепт" };
  }
}

export async function toggleRecipePublic(
  input: unknown,
): Promise<ActionResult<{ isPublic: boolean }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = togglePublicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  const existing = await getRecipeByIdForOwner(parsed.data.id, userId);
  if (!existing) {
    return { success: false, error: "Рецепт не найден или доступ запрещён" };
  }

  try {
    const visibility = visibilityFromIsPublic(parsed.data.isPublic);

    await prisma.recipe.update({
      where: { id: parsed.data.id },
      data: {
        visibility,
        publishedAt: parsed.data.isPublic ? new Date() : null,
      },
    });

    revalidateDashboardPaths();
    return {
      success: true,
      data: { isPublic: parsed.data.isPublic },
    };
  } catch (error) {
    console.error("toggleRecipePublic:", error);
    return { success: false, error: "Не удалось изменить публичность" };
  }
}

export async function toggleRecipeFavorite(
  input: unknown,
): Promise<ActionResult<{ isFavorite: boolean }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") {
    return userId;
  }

  const parsed = toggleFavoriteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Некорректные данные",
    };
  }

  const existing = await getRecipeByIdForOwner(parsed.data.id, userId);
  if (!existing) {
    return { success: false, error: "Рецепт не найден или доступ запрещён" };
  }

  try {
    const updated = await prisma.recipe.update({
      where: { id: parsed.data.id },
      data: { isFavorite: !existing.isFavorite },
    });

    revalidateDashboardPaths();
    return {
      success: true,
      data: { isFavorite: updated.isFavorite },
    };
  } catch (error) {
    console.error("toggleRecipeFavorite:", error);
    return { success: false, error: "Не удалось изменить избранное" };
  }
}
