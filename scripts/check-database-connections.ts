/**
 * Диагностика DATABASE_URL и DIRECT_URL без вывода секретов.
 * Запуск: npx tsx scripts/check-database-connections.ts
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeParseUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function extractErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  if (error instanceof Error) {
    const match = error.message.match(/\b(P\d{4})\b/);
    if (match) return match[1];
    if (/ECONNRESET/i.test(error.message)) return "ECONNRESET";
  }
  return "UNKNOWN";
}

type StepResult = { ok: boolean; code: string };

async function runStep(
  label: string,
  fn: () => Promise<unknown>,
): Promise<StepResult> {
  try {
    await fn();
    return { ok: true, code: "OK" };
  } catch (error) {
    return { ok: false, code: extractErrorCode(error) };
  }
}

async function checkConnection(
  label: "DATABASE_URL" | "DIRECT_URL",
  url: string | undefined,
): Promise<void> {
  console.log(`\n=== ${label} (3 прогона) ===`);

  if (!url) {
    console.log(`${label}: переменная не задана`);
    return;
  }

  for (let run = 1; run <= 3; run += 1) {
    const prisma = new PrismaClient({
      datasources: { db: { url } },
    });

    try {
      const select1 = await runStep("SELECT 1", () =>
        prisma.$queryRaw`SELECT 1`,
      );
      const categoryCount = await runStep("category.count", () =>
        prisma.category.count(),
      );
      const recipeCount = await runStep("recipe.count", () =>
        prisma.recipe.count(),
      );

      console.log(
        `Прогон ${run}: SELECT 1=${select1.ok ? "успешно" : "ошибка"} (${select1.code}); category.count=${categoryCount.ok ? "успешно" : "ошибка"} (${categoryCount.code}); recipe.count=${recipeCount.ok ? "успешно" : "ошибка"} (${recipeCount.code})`,
      );
    } finally {
      await prisma.$disconnect();
    }

    if (run < 3) {
      await sleep(800);
    }
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const databaseParsed = safeParseUrl(databaseUrl);
  const directParsed = safeParseUrl(directUrl);

  const activeDatabaseUrlLines = (
    await import("node:fs").then((fs) =>
      fs.readFileSync(".env", "utf8").split(/\r?\n/),
    )
  ).filter((line) => /^DATABASE_URL=/.test(line.trim())).length;

  console.log("=== Конфигурация (без значений) ===");
  console.log(`DATABASE_URL существует: ${databaseUrl ? "да" : "нет"}`);
  console.log(`DIRECT_URL существует: ${directUrl ? "да" : "нет"}`);
  console.log(
    `DATABASE_URL указывает на localhost: ${
      databaseParsed &&
      (databaseParsed.hostname === "localhost" ||
        databaseParsed.hostname === "127.0.0.1")
        ? "да"
        : "нет"
    }`,
  );
  console.log(
    `DATABASE_URL использует pooled-host (-pooler): ${
      databaseParsed?.hostname.includes("-pooler") ? "да" : "нет"
    }`,
  );
  console.log(
    `DIRECT_URL использует pooled-host (-pooler): ${
      directParsed?.hostname.includes("-pooler") ? "да" : "нет"
    }`,
  );
  console.log(
    `DATABASE_URL и DIRECT_URL совпадают полностью: ${
      databaseUrl && directUrl && databaseUrl === directUrl ? "да" : "нет"
    }`,
  );
  console.log(`Активных строк DATABASE_URL в .env: ${activeDatabaseUrlLines}`);

  await checkConnection("DATABASE_URL", databaseUrl);
  await checkConnection("DIRECT_URL", directUrl);

  console.log("\n=== Симуляция загрузки /dashboard (5 прогонов) ===");
  const { getCategories, getMyRecipes } = await import("@/lib/recipes/queries");
  const { prisma } = await import("@/lib/prisma");
  const owner = await prisma.user.findFirst({ select: { id: true } });

  for (let run = 1; run <= 5; run += 1) {
    const started = Date.now();
    try {
      const categories = await getCategories();
      const recipes = owner
        ? await getMyRecipes(owner.id, {})
        : { total: 0 };
      console.log(
        `Прогон ${run}: успешно — категорий ${categories.length}, рецептов ${recipes.total} (${Date.now() - started} ms)`,
      );
    } catch (error) {
      console.log(
        `Прогон ${run}: ошибка (${extractErrorCode(error)}) (${Date.now() - started} ms)`,
      );
    }

    if (run < 5) {
      await sleep(2500);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(
    "Диагностика завершилась с ошибкой:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
