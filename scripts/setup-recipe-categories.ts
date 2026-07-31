/**
 * Идемпотентная настройка основных категорий и перенос всех рецептов в «Подкормку».
 * Запуск: npm run db:setup-categories
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_CATEGORY_NAME,
  LEGACY_CATEGORY_NAMES,
  PRIMARY_CATEGORY_NAMES,
} from "@/lib/recipes/constants";
import {
  categoryNamesEqual,
  findCategoryByNameCaseInsensitive,
} from "@/lib/recipes/category-helpers";

config();

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const RETRYABLE = /P1001|P1017|closed the connection|ECONNRESET/i;

function resolveScriptDatabaseUrl(): string {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DIRECT_URL или DATABASE_URL не задан в .env");
  }

  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  url.searchParams.set("connect_timeout", "60");
  return url.toString();
}

function detectDbEnvironment(): "local" | "neon" | "unknown" {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) return "unknown";

  try {
    const hostname = new URL(raw).hostname.toLowerCase();
    if (LOCAL_HOSTS.has(hostname)) return "local";
    if (hostname.includes("neon")) return "neon";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: resolveScriptDatabaseUrl() } },
  });
}

async function withRetry<T>(
  label: string,
  fn: (prisma: PrismaClient) => Promise<T>,
  attempts = 5,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const prisma = createClient();
    try {
      const result = await fn(prisma);
      await prisma.$disconnect();
      return result;
    } catch (error) {
      lastError = error;
      await prisma.$disconnect().catch(() => undefined);

      const message = error instanceof Error ? error.message : String(error);
      if (attempt < attempts && RETRYABLE.test(message)) {
        console.log(`${label}: повтор ${attempt}/${attempts}`);
        await sleep(1500 * attempt);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function ensurePrimaryCategory(
  prisma: PrismaClient,
  name: string,
): Promise<{ id: string; created: boolean }> {
  const existing = await findCategoryByNameCaseInsensitive(prisma, name);
  if (existing) {
    return { id: existing.id, created: false };
  }

  const created = await prisma.category.create({
    data: { category: name },
  });
  return { id: created.id, created: true };
}

async function main() {
  const environment = detectDbEnvironment();
  console.log("=== Настройка категорий рецептов ===");
  console.log(`Среда подключения: ${environment}`);
  console.log(
    "Примечание: для локальной PostgreSQL и Neon выполните скрипт отдельно в каждой базе, где нужны категории.\n",
  );

  let categoriesCreated = 0;

  for (const name of PRIMARY_CATEGORY_NAMES) {
    const result = await withRetry(`category:${name}`, (prisma) =>
      ensurePrimaryCategory(prisma, name),
    );
    if (result.created) {
      categoriesCreated += 1;
      console.log(`Создана категория: ${name}`);
    }
  }

  const defaultCategory = await withRetry("category:default", (prisma) =>
    findCategoryByNameCaseInsensitive(prisma, DEFAULT_CATEGORY_NAME),
  );

  if (!defaultCategory) {
    throw new Error(`Категория «${DEFAULT_CATEGORY_NAME}» не найдена после создания`);
  }

  const recipesUpdated = await withRetry("recipes:assign-default", async (prisma) => {
    const updateResult = await prisma.recipe.updateMany({
      data: { categoryId: defaultCategory.id },
    });
    console.log(
      `Обновлено рецептов (categoryId → «${DEFAULT_CATEGORY_NAME}»): ${updateResult.count}`,
    );
    return updateResult.count;
  });

  const categoriesDeleted = await withRetry("categories:cleanup", async (prisma) => {
    let deleted = 0;
    const allCategories = await prisma.category.findMany({
      include: { _count: { select: { recipes: true } } },
    });

    for (const item of allCategories) {
      const isPrimary = PRIMARY_CATEGORY_NAMES.some((name) =>
        categoryNamesEqual(name, item.category),
      );
      if (isPrimary || item._count.recipes > 0) {
        continue;
      }

      const isLegacy = LEGACY_CATEGORY_NAMES.some((name) =>
        categoryNamesEqual(name, item.category),
      );
      if (!isLegacy) {
        console.log(
          `Категория «${item.category}» не используется, но не входит в список служебных — оставлена в базе`,
        );
        continue;
      }

      await prisma.category.delete({ where: { id: item.id } });
      deleted += 1;
      console.log(`Удалена неиспользуемая категория: ${item.category}`);
    }

    return deleted;
  });

  const finalCategories = await withRetry("summary", (prisma) =>
    prisma.category.findMany({
      orderBy: { category: "asc" },
      select: { category: true, _count: { select: { recipes: true } } },
    }),
  );

  console.log("\n=== Итог ===");
  console.log(`Создано категорий: ${categoriesCreated}`);
  console.log(`Обновлено рецептов: ${recipesUpdated}`);
  console.log(`Удалено служебных категорий: ${categoriesDeleted}`);
  console.log(`Всего категорий в базе: ${finalCategories.length}`);
  for (const item of finalCategories) {
    console.log(`  - ${item.category} (рецептов: ${item._count.recipes})`);
  }
}

main().catch((error) => {
  console.error(
    "Ошибка настройки категорий:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
