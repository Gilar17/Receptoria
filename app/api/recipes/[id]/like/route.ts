import { NextResponse } from "next/server";
import { RecipeVisibility } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Чтобы поставить лайк, войдите в аккаунт" },
      { status: 401 },
    );
  }

  const { id: recipeId } = await context.params;
  const userId = session.user.id;

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, visibility: true },
    });

    if (!recipe || recipe.visibility !== RecipeVisibility.PUBLIC) {
      return NextResponse.json(
        { error: "Публичный рецепт не найден" },
        { status: 404 },
      );
    }

    const existing = await prisma.recipeLike.findUnique({
      where: {
        userId_recipeId: { userId, recipeId },
      },
    });

    let liked: boolean;

    if (existing) {
      await prisma.recipeLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      try {
        await prisma.recipeLike.create({
          data: { userId, recipeId },
        });
        liked = true;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          await prisma.recipeLike.delete({
            where: { userId_recipeId: { userId, recipeId } },
          });
          liked = false;
        } else {
          throw error;
        }
      }
    }

    const likesCount = await prisma.recipeLike.count({
      where: { recipeId },
    });

    return NextResponse.json({ liked, likesCount });
  } catch (error) {
    console.error("POST /api/recipes/[id]/like:", error);
    return NextResponse.json(
      { error: "Не удалось поставить лайк. Попробуйте позже" },
      { status: 500 },
    );
  }
}
