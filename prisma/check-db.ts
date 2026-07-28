import { RecipeVisibility } from "@prisma/client";
import { withDb } from "@/lib/db-client";

const TEST_USER_EMAIL = "db-check@receptoria.local";
const TEST_USER_NAME = "DB Check User";
const TEST_CATEGORY_NAME = "Тестовая категория";
const TEST_RECIPE_ID = "cldbcheckrecipe000000001";

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

async function ensureRecipe(ownerId: string, categoryId: string) {
  return withDb("recipe", (prisma) =>
    prisma.recipe.upsert({
      where: { id: TEST_RECIPE_ID },
      update: {
        ownerId,
        categoryId,
        title: "Тестовый рецепт Receptoria",
        content: "Ингредиенты и шаги для проверки схемы БД.",
        description: "Создан проверочным скриптом db:check",
        visibility: RecipeVisibility.PUBLIC,
        publishedAt: new Date(),
      },
      create: {
        id: TEST_RECIPE_ID,
        ownerId,
        categoryId,
        title: "Тестовый рецепт Receptoria",
        content: "Ингредиенты и шаги для проверки схемы БД.",
        description: "Создан проверочным скриптом db:check",
        visibility: RecipeVisibility.PUBLIC,
        publishedAt: new Date(),
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

async function printCounts(recipeId: string) {
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
    console.log(`  Recipe id: ${recipeId}`);
  });
}

async function main() {
  const category = await ensureCategory();
  const user = await ensureUser();
  const recipe = await ensureRecipe(user.id, category.id);
  await ensureVote(user.id, recipe.id);
  await printCounts(recipe.id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
