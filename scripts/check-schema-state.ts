import { config } from "dotenv";
import { withDb } from "../lib/db-client";

config();

async function existsTable(prisma: import("@prisma/client").PrismaClient, table: string) {
  const r = await prisma.$queryRaw<{ e: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = ${table}
    ) AS e
  `;
  return Boolean(r[0]?.e);
}

async function existsColumn(
  prisma: import("@prisma/client").PrismaClient,
  table: string,
  column: string,
) {
  const r = await prisma.$queryRaw<{ e: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    ) AS e
  `;
  return Boolean(r[0]?.e);
}

async function existsIndex(
  prisma: import("@prisma/client").PrismaClient,
  indexName: string,
) {
  const r = await prisma.$queryRaw<{ e: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = ${indexName}
    ) AS e
  `;
  return Boolean(r[0]?.e);
}

async function main() {
  await withDb("schema-check", async (prisma) => {
    const checks = {
      RecipeLike_table: await existsTable(prisma, "RecipeLike"),
      RecipeLike_unique: await existsIndex(prisma, "RecipeLike_userId_recipeId_key"),
      RecipeFavorite_table: await existsTable(prisma, "RecipeFavorite"),
      RecipeFavorite_unique: await existsIndex(
        prisma,
        "RecipeFavorite_userId_recipeId_key",
      ),
      Note_title: await existsColumn(prisma, "Note", "title"),
      Note_content: await existsColumn(prisma, "Note", "content"),
      Note_updatedAt: await existsColumn(prisma, "Note", "updatedAt"),
      Note_ownerId_idx: await existsIndex(prisma, "Note_ownerId_idx"),
      Note_createdAt_idx: await existsIndex(prisma, "Note_createdAt_idx"),
    };

    console.log(JSON.stringify(checks, null, 2));

    if (checks.Note_content) {
      const rows = await prisma.$queryRaw<{ c: number; empty: number }[]>`
        SELECT COUNT(*)::int AS c,
               COUNT(*) FILTER (WHERE TRIM("content") = '')::int AS empty
        FROM "Note"
      `;
      console.log("Note rows:", rows[0]);
    } else if (checks.Note_title) {
      const rows = await prisma.$queryRaw<{ c: number }[]>`
        SELECT COUNT(*)::int AS c FROM "Note"
      `;
      console.log("Note rows (title era):", rows[0]);
    }
  }, { attempts: 8 });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
