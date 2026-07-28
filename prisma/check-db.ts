import { RecipeVisibility } from "@prisma/client";
import { withDb } from "@/lib/db-client";

const TEST_USER_EMAIL = "db-check@receptoria.local";
const TEST_USER_NAME = "DB Check User";
const TEST_CATEGORY_NAME = "Тестовая категория";
const TEST_RECIPE_ID_1 = "cldbcheckrecipe000000001";
const TEST_RECIPE_ID_2 = "cldbcheckrecipe000000002";

async function ensureCategory() {
  return withDb("category", async (prisma) => {
    const existing = await prisma.category.findFirst({
      where: { category: TEST_CATEGORY_NAME },
    });

    if (existing) {
      return existing;
    }

    return prisma.category.create({
      data: { category: TEST_CATEGORY_NAME },
    });
  });
}

async function ensureUser() {
  return withDb("user", (prisma) =>
    prisma.user.upsert({
      where: { email: TEST_USER_EMAIL },
      update: { name: TEST_USER_NAME },
      create: {
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME,
      },
    }),
  );
}

async function ensureRecipe(
  id: string,
  ownerId: string,
  categoryId: string,
  title: string,
  content: string,
  visibility: RecipeVisibility,
) {
  return withDb(`recipe-${id}`, (prisma) =>
    prisma.recipe.upsert({
      where: { id },
      update: {
        ownerId,
        categoryId,
        title,
        content,
        description: "Создан проверочным скриптом db:check",
        visibility,
        publishedAt: visibility === RecipeVisibility.PUBLIC ? new Date() : null,
      },
      create: {
        id,
        ownerId,
        categoryId,
        title,
        content,
        description: "Создан проверочным скриптом db:check",
        visibility,
        publishedAt: visibility === RecipeVisibility.PUBLIC ? new Date() : null,
      },
    }),
  );
}

async function ensureVote(userId: string, recipeId: string) {
  return withDb("vote", (prisma) =>
    prisma.vote.upsert({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
      update: { value: 1 },
      create: {
        userId,
        recipeId,
        value: 1,
      },
    }),
  );
}

async function printCounts(recipeIds: string[]) {
  await withDb("counts", async (prisma) => {
    const [userCount, categoryCount, recipeCount, voteCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.category.count(),
        prisma.recipe.count(),
        prisma.vote.count(),
      ]);

    console.log("Проверка БД успешна:");
    console.log(`  User:     ${userCount}`);
    console.log(`  Category: ${categoryCount}`);
    console.log(`  Recipe:   ${recipeCount}`);
    console.log(`  Vote:     ${voteCount}`);
    for (const recipeId of recipeIds) {
      console.log(`  Recipe id: ${recipeId}`);
    }
  });
}

async function main() {
  const category = await ensureCategory();
  const user = await ensureUser();

  const recipe1 = await ensureRecipe(
    TEST_RECIPE_ID_1,
    user.id,
    category.id,
    "Первый тестовый рецепт",
    "Шаг 1. Подготовить ингредиенты.",
    RecipeVisibility.PUBLIC,
  );

  const recipe2 = await ensureRecipe(
    TEST_RECIPE_ID_2,
    user.id,
    category.id,
    "Второй тестовый рецепт",
    "Шаг 1. Нарезать овощи.",
    RecipeVisibility.PRIVATE,
  );

  await ensureVote(user.id, recipe1.id);
  await printCounts([recipe1.id, recipe2.id]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
