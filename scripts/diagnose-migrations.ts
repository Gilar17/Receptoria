/**
 * Диагностика состояния миграций и схемы Neon без изменения данных.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config();

async function tableExists(
  prisma: PrismaClient,
  table: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ${table}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function columnExists(
  prisma: PrismaClient,
  table: string,
  column: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function indexExists(
  prisma: PrismaClient,
  indexName: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = ${indexName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function main(): Promise<void> {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) throw new Error("DIRECT_URL или DATABASE_URL не задан");

  const url = new URL(raw);
  console.log("=== Подключение ===");
  console.log(
    JSON.stringify(
      {
        host: url.hostname,
        isPooler:
          url.hostname.includes("-pooler") || url.searchParams.has("pgbouncer"),
        usesDirectUrl: Boolean(process.env.DIRECT_URL),
      },
      null,
      2,
    ),
  );

  const prisma = new PrismaClient({
    datasources: { db: { url: raw } },
  });

  try {
    await prisma.$connect();

    console.log("\n=== _prisma_migrations ===");
    const migrations = await prisma.$queryRaw<
      {
        migration_name: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
        applied_steps_count: number;
      }[]
    >`
      SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY started_at
    `;

    for (const row of migrations) {
      const status = row.rolled_back_at
        ? "rolled_back"
        : row.finished_at
          ? "applied"
          : "failed/pending";
      console.log(
        `  ${row.migration_name} | ${status} | steps=${row.applied_steps_count}`,
      );
    }

    console.log("\n=== RecipeLike ===");
    console.log(`  table: ${await tableExists(prisma, "RecipeLike")}`);

    console.log("\n=== RecipeFavorite ===");
    console.log(`  table: ${await tableExists(prisma, "RecipeFavorite")}`);

    console.log("\n=== Note ===");
    console.log(`  title: ${await columnExists(prisma, "Note", "title")}`);
    console.log(`  content: ${await columnExists(prisma, "Note", "content")}`);
    console.log(
      `  updatedAt: ${await columnExists(prisma, "Note", "updatedAt")}`,
    );
    console.log(
      `  Note_ownerId_idx: ${await indexExists(prisma, "Note_ownerId_idx")}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
