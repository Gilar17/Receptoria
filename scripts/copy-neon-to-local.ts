import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

type Counts = {
  users: number;
  categories: number;
  notes: number;
  recipes: number;
  tags: number;
  votes: number;
  recipeTagLinks: number;
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const LOCAL_DB_NAME = "receptoria";

const TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 30000,
};

function normalizeDatabaseUrl(raw: string): string {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  url.searchParams.set("connect_timeout", "60");

  if (url.hostname.includes("-pooler") && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
  }

  return url.toString();
}

function getDatabaseName(connectionUrl: string): string {
  const pathname = new URL(connectionUrl).pathname.replace(/^\//, "");
  return pathname.split("?")[0];
}

function assertSafeEndpoints(sourceUrl: string, targetUrl: string): void {
  const source = new URL(sourceUrl);
  const target = new URL(targetUrl);

  if (LOCAL_HOSTS.has(source.hostname)) {
    throw new Error(
      "Источник не должен указывать на localhost. Проверьте DIRECT_URL.",
    );
  }

  if (!LOCAL_HOSTS.has(target.hostname)) {
    throw new Error(
      "Назначение должно указывать только на localhost. Проверьте LOCAL_DIRECT_URL.",
    );
  }

  const targetDbName = getDatabaseName(targetUrl);
  if (targetDbName !== LOCAL_DB_NAME) {
    throw new Error(
      `Локальная база должна называться "${LOCAL_DB_NAME}", получено "${targetDbName}".`,
    );
  }
}

function createClient(connectionUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: normalizeDatabaseUrl(connectionUrl) } },
  });
}

function requireEnv(name: "DIRECT_URL" | "LOCAL_DIRECT_URL"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Переменная окружения ${name} не задана.`);
  }
  return value;
}

function isConnectionClosedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = String((error as { code: unknown }).code);
  return code === "P1001" || code === "P1002" || code === "P1017";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(
  prisma: PrismaClient,
  label: string,
  query: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await prisma.$connect();
      return await query();
    } catch (error) {
      lastError = error;

      if (attempt < 5 && isConnectionClosedError(error)) {
        console.log(`${label}: повтор ${attempt}/5`);
        await sleep(1500 * attempt);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function countRecipeTagLinks(prisma: PrismaClient): Promise<number> {
  const recipes = await prisma.recipe.findMany({
    select: {
      _count: {
        select: { tags: true },
      },
    },
  });

  return recipes.reduce((sum, recipe) => sum + recipe._count.tags, 0);
}

async function collectCountsResilient(
  prisma: PrismaClient,
  label: string,
): Promise<Counts> {
  const q = <T>(step: string, fn: () => Promise<T>) =>
    runWithRetry(prisma, `${label}/${step}`, fn);

  const users = await q("User", () => prisma.user.count());
  const categories = await q("Category", () => prisma.category.count());
  const notes = await q("Note", () => prisma.note.count());
  const recipes = await q("Recipe", () => prisma.recipe.count());
  const tags = await q("Tag", () => prisma.tag.count());
  const votes = await q("Vote", () => prisma.vote.count());
  const recipeTagLinks = await q("Recipe–Tag", () => countRecipeTagLinks(prisma));

  return {
    users,
    categories,
    notes,
    recipes,
    tags,
    votes,
    recipeTagLinks,
  };
}

function printCountsTable(title: string, neon: Counts, local: Counts): void {
  console.log(`\n${title}`);
  console.log("Модель / связь      | Neon | Локальная БД | Совпадает");
  console.log("--------------------+------+--------------+----------");

  const rows: Array<[string, number, number]> = [
    ["User", neon.users, local.users],
    ["Category", neon.categories, local.categories],
    ["Note", neon.notes, local.notes],
    ["Recipe", neon.recipes, local.recipes],
    ["Tag", neon.tags, local.tags],
    ["Vote", neon.votes, local.votes],
    ["Recipe–Tag", neon.recipeTagLinks, local.recipeTagLinks],
  ];

  for (const [label, neonCount, localCount] of rows) {
    const match = neonCount === localCount ? "да" : "нет";
    console.log(
      `${label.padEnd(19)} | ${String(neonCount).padStart(4)} | ${String(localCount).padStart(12)} | ${match}`,
    );
  }
}

function assertCountsMatch(neon: Counts, local: Counts): void {
  const mismatches: string[] = [];

  if (neon.users !== local.users) mismatches.push("User");
  if (neon.categories !== local.categories) mismatches.push("Category");
  if (neon.notes !== local.notes) mismatches.push("Note");
  if (neon.recipes !== local.recipes) mismatches.push("Recipe");
  if (neon.tags !== local.tags) mismatches.push("Tag");
  if (neon.votes !== local.votes) mismatches.push("Vote");
  if (neon.recipeTagLinks !== local.recipeTagLinks) {
    mismatches.push("Recipe–Tag");
  }

  if (mismatches.length > 0) {
    throw new Error(
      `Количество записей не совпадает для: ${mismatches.join(", ")}.`,
    );
  }
}

async function readSourceData(sourcePrisma: PrismaClient) {
  const [users, categories, tags, notes, recipes, votes] = await Promise.all([
    sourcePrisma.user.findMany({
      orderBy: { createdAt: "asc" },
    }),
    sourcePrisma.category.findMany({
      orderBy: { id: "asc" },
    }),
    sourcePrisma.tag.findMany({
      orderBy: { createdAt: "asc" },
    }),
    sourcePrisma.note.findMany({
      orderBy: { createdAt: "asc" },
    }),
    sourcePrisma.recipe.findMany({
      include: {
        tags: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    sourcePrisma.vote.findMany({
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const recipeTagLinks = recipes.reduce(
    (sum, recipe) => sum + recipe.tags.length,
    0,
  );

  return {
    users,
    categories,
    tags,
    notes,
    recipes,
    votes,
    recipeTagLinks,
  };
}

type SourceData = Awaited<ReturnType<typeof readSourceData>>;

async function applyLocalData(
  targetPrisma: PrismaClient,
  data: SourceData,
): Promise<void> {
  await targetPrisma.$transaction(async (tx) => {
    await tx.vote.deleteMany();

    const localRecipes = await tx.recipe.findMany({
      select: { id: true },
    });

    for (const recipe of localRecipes) {
      await tx.recipe.update({
        where: { id: recipe.id },
        data: { tags: { set: [] } },
      });
    }

    await tx.recipe.deleteMany();
    await tx.note.deleteMany();
    await tx.tag.deleteMany();
    await tx.category.deleteMany();
    await tx.user.deleteMany();

    for (const user of data.users) {
      await tx.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    }

    for (const category of data.categories) {
      await tx.category.create({
        data: {
          id: category.id,
          category: category.category,
        },
      });
    }

    for (const tag of data.tags) {
      await tx.tag.create({
        data: {
          id: tag.id,
          name: tag.name,
          createdAt: tag.createdAt,
        },
      });
    }

    for (const note of data.notes) {
      await tx.note.create({
        data: {
          id: note.id,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          ownerId: note.ownerId,
        },
      });
    }

    for (const recipe of data.recipes) {
      await tx.recipe.create({
        data: {
          id: recipe.id,
          ownerId: recipe.ownerId,
          title: recipe.title,
          content: recipe.content,
          description: recipe.description,
          categoryId: recipe.categoryId,
          visibility: recipe.visibility,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
          publishedAt: recipe.publishedAt,
        },
      });
    }

    for (const recipe of data.recipes) {
      if (recipe.tags.length === 0) {
        continue;
      }

      await tx.recipe.update({
        where: { id: recipe.id },
        data: {
          tags: {
            connect: recipe.tags.map((tag) => ({ id: tag.id })),
          },
        },
      });
    }

    for (const vote of data.votes) {
      await tx.vote.create({
        data: {
          id: vote.id,
          userId: vote.userId,
          recipeId: vote.recipeId,
          value: vote.value,
          createdAt: vote.createdAt,
        },
      });
    }
  }, TRANSACTION_OPTIONS);
}

async function ensureClientAlive(
  prisma: PrismaClient,
  label: string,
): Promise<void> {
  await runWithRetry(prisma, `${label}: ping`, () => prisma.$queryRaw`SELECT 1`);
}

async function verifyFinalCounts(
  sourcePrisma: PrismaClient,
  targetPrisma: PrismaClient,
): Promise<void> {
  console.log("Итоговая проверка: переподключение и подсчёт...");

  // После длительной локальной транзакции Neon-соединение sourcePrisma могло
  // простаивать и быть закрыто сервером (P1017). Перед подсчётом — явный ping.
  await ensureClientAlive(sourcePrisma, "Neon");
  const neonCounts = await collectCountsResilient(sourcePrisma, "Neon");

  await ensureClientAlive(targetPrisma, "Локальная БД");
  const localCounts = await collectCountsResilient(targetPrisma, "Локальная БД");

  printCountsTable("Сравнение после переноса", neonCounts, localCounts);
  assertCountsMatch(neonCounts, localCounts);
}

async function runDryRun(
  sourcePrisma: PrismaClient,
  targetPrisma: PrismaClient,
): Promise<void> {
  const neonCounts = await collectCountsResilient(sourcePrisma, "Neon");
  const localCounts = await collectCountsResilient(targetPrisma, "Локальная БД");

  console.log("Режим: --dry-run");
  console.log("Источник: Neon (DIRECT_URL)");
  console.log("Назначение: локальная PostgreSQL (LOCAL_DIRECT_URL)");
  console.log("\nПлан переноса:");
  console.log("1. Прочитать из Neon: User, Category, Tag, Note, Recipe+tags, Vote");
  console.log("2. Очистить локально: Vote → Recipe–Tag → Recipe → Note → Tag → Category → User");
  console.log("3. Создать локально: User → Category → Tag → Note → Recipe → Recipe–Tag → Vote");
  console.log("4. Neon не изменяется");

  printCountsTable("Текущие количества", neonCounts, localCounts);

  console.log("\nDry-run завершён. Данные не изменялись.");
}

async function runApply(
  sourcePrisma: PrismaClient,
  targetPrisma: PrismaClient,
): Promise<void> {
  console.log("Режим: --apply");
  console.log("Чтение данных из Neon...");

  const sourceData = await readSourceData(sourcePrisma);

  console.log("Данные Neon прочитаны:");
  console.log(`  User: ${sourceData.users.length}`);
  console.log(`  Category: ${sourceData.categories.length}`);
  console.log(`  Tag: ${sourceData.tags.length}`);
  console.log(`  Note: ${sourceData.notes.length}`);
  console.log(`  Recipe: ${sourceData.recipes.length}`);
  console.log(`  Vote: ${sourceData.votes.length}`);
  console.log(`  Recipe–Tag: ${sourceData.recipeTagLinks}`);

  console.log("\nЛокальная транзакция: очистка и запись...");
  await applyLocalData(targetPrisma, sourceData);
  console.log("Локальная транзакция завершена.");

  try {
    await verifyFinalCounts(sourcePrisma, targetPrisma);
    console.log("\nПеренос завершён успешно. Neon не изменялась.");
  } catch (error) {
    console.error(
      "\nИтоговая проверка не удалась. Это не означает автоматический откат транзакции.",
    );
    console.error("Проверьте фактическое состояние командой: npm run db:copy:dry");

    throw error;
  }
}

async function main(): Promise<void> {
  const isApply = process.argv.includes("--apply");
  const isDryRun = process.argv.includes("--dry-run");

  if (isApply === isDryRun) {
    throw new Error("Укажите ровно один режим: --dry-run или --apply.");
  }

  const sourceUrl = requireEnv("DIRECT_URL");
  const targetUrl = requireEnv("LOCAL_DIRECT_URL");
  assertSafeEndpoints(sourceUrl, targetUrl);

  const sourcePrisma = createClient(sourceUrl);
  const targetPrisma = createClient(targetUrl);

  try {
    await sourcePrisma.$connect();
    await targetPrisma.$connect();

    if (isDryRun) {
      await runDryRun(sourcePrisma, targetPrisma);
      return;
    }

    await runApply(sourcePrisma, targetPrisma);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
